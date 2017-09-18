import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { userIsOwner, constants, isNumber } from '../shared';
import { AuctionsService, UsersService, AlertService } from '../services';
import {
  Auction,
  User,
  BidMessage,
  StreamMessage,
  StreamMessageType,
  AuctionEndMessage,
  ErrorMessage
} from '../models';

@Component({
  selector: 'auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css']
})
export class AuctionComponent implements OnInit, OnDestroy {
  private _paramSub: Subscription;
  private _currentUser: User;
  private _bidderIdCounter = 1;
  private _lastAcceptedBiderId: string | string[] = null

  newUserBid: number;
  newAskPrice: number;
  userBid: number = null;

  liveAuction: Observable<Auction>;
  auction: Auction;

  bids: { [userId: string]: number } = {};
  bidderNames: { [bidderId: string]: string } = {};

  constructor(
    private _route: ActivatedRoute,
    private _usersService: UsersService,
    private _auctionsService: AuctionsService,
    private _alertService: AlertService,
    private _router: Router
  ) { }

  get currentUser() {
    if (!this._currentUser) {
      this._currentUser = this._usersService.getCurrentUser();
    }
    return this._currentUser;
  }

  ngOnInit() {
    this._paramSub = this._route.params.subscribe(p => {
      this.liveAuction = this._auctionsService.subscribeForAuctionAndUpdates(p.id);
      this.liveAuction.subscribe((auction) => {
        const isInitialized = !!this.auction;
        const auctionJustStarted = isInitialized && this._isAuctionStartEvent(auction);

        this.auction = auction;
        this.newUserBid = this.getMinBid();
        this.newAskPrice = this.getMinBid();

        if ((this.isOngoing() && !isInitialized) || (auctionJustStarted && !this.isOwner())) {
          this._subForUserRoleData();
        }
      });
    });
  }

  isOwner() {
    return userIsOwner(this.currentUser, this.auction);
  }

  hasStarted() {
    return this.auction && this.auction.start;
  }

  hasEnded() {
    return this.auction && this.auction.end;
  }

  isOngoing() {
    return this.hasStarted() && !this.hasEnded();
  }

  hasBidders() {
    return this.getBidders().length > 0;
  }

  getBidders() {
    return Object.keys(this.bids);
  }

  getBidderName(bidderId: string) {
    if (!this.bidderNames[bidderId]) {
      this.bidderNames[bidderId] = `Bidder ${this._bidderIdCounter++}`;
    }
    return this.bidderNames[bidderId];
  }

  newUserBidIsInvalid() {
    return this.newUserBid < this.getMinBid() || this.newUserBid <= this.userBid;
  }

  startAuction() {
    this._alertService.askConfirmation(`Start auction for ${this.auction.item}?`)
      .then(() => this._auctionsService.startAuction(this.auction))
      .then(() => this._subOwner())
      .catch(e => e && this._alertService.showError(e.message));
  }

  userHasRegistered() {
    return this._auctionsService.userIsRegistered(this.currentUser._id, this.auction);
  }

  register() {
    this._auctionsService.registerForAuction(this.auction, this.currentUser._id)
      .catch(e => this._alertService.showError(e.message));
  }

  unregister() {
    this._alertService.askConfirmation(`Unregister from the auction for ${this.auction.item}?`)
      .then(() => this._auctionsService.unregisterFromAuction(this.auction, this.currentUser._id))
      .catch(e => e && this._alertService.showError(e.message));
  }

  finishAuction() {
    const msg = `Finish auction for ${this.auction.item} and accept bid of $${this.auction.currentBid}?`;
    this._alertService.askConfirmation(msg)
      .then(() => this._auctionsService.finishAuction(this.auction))
      .then(() => {
        const msg: AuctionEndMessage = {
          fromUser: (this.auction._acl as any).creator,
          type: StreamMessageType.AuctionEnd,
          winner: this._lastAcceptedBiderId
        };
        return this._auctionsService.sendMessageToParticipants(this.auction, msg);
      })
      .then(() => {
        return this._auctionsService.unsubscribeFromStatusUpdates(this.currentUser._id);
      })
      .catch(e => e && this._alertService.showError(e.message));
  }

  deleteAuction() {
    this._alertService.askConfirmation('Are you sure you want to delete this auction?')
      .then(() => this._auctionsService.delete(this.auction._id))
      .then(() => this._router.navigateByUrl('/home'))
      .catch(e => e && this._alertService.showError(e.message));
  }

  ngOnDestroy() {
    if (this._paramSub) {
      this._paramSub.unsubscribe();
    }

    this._auctionsService.unsubscribeFromAuctionUpdates();

    if (this.isOwner()) {
      this._unsubOwner();
    } else {
      this._unsubParticipant();
    }
  }

  ensureMinBid() {
    const minBid = this.getMinBid();

    if (this.newUserBid < minBid) {
      this.newUserBid = minBid;
    }
  }

  bidOnItem() {
    this._auctionsService.bidOnAuction(this.auction, this.currentUser._id, this.newUserBid)
      .then(() => {
        this.userBid = this.newUserBid;
      })
      .catch(e => this._alertService.showError(e.message));
  }

  acceptBid(bidderId: string) {
    const acceptedBid = this.bids[bidderId];

    if (acceptedBid <= this.auction.currentBid) {
      const msg: ErrorMessage = {
        type: StreamMessageType.Error,
        fromUser: this.currentUser._id,
        error: 'Your bid was rejected. You were outbid, or it was invalid. Please try again'
      };
      return this._auctionsService.sendMessageToParticipant(bidderId, msg)
        .catch(e => this._alertService.showError(e.message));
    }

    this._auctionsService.acceptBidOnAuction(this.auction, bidderId, acceptedBid, this.newAskPrice)
      .then(() => {
        const bidders = this.getBidders().filter(b => this.bids[b] === acceptedBid);
        this._lastAcceptedBiderId = (bidders && bidders.length === 1) ? bidders[0] : bidders;
      })
      .catch(e => this._alertService.showError(e.message));
  }

  getMinBid() {
    if (this.auction.ask) {
      return this.auction.ask;
    }
    return this.auction.currentBid + constants.auctionMinStep;
  }

  isHighestBidder() {
    return !this.isOwner() && this.userBid !== null && this.userBid === this.auction.currentBid;
  }

  private _subForUserRoleData() {
    let result = Promise.resolve<any>(null);

    if (this.isOwner() && this.auction.participants) {
      result = this._subOwner();
    } else if (this.userHasRegistered()) {
      result = this._subParticipant();
    }

    return result;
  }

  private _subOwner() {
    return this._auctionsService.subscribeForBids(this.auction, (bidMsg) => {
      this._onReceivedBid(bidMsg);
    })
      .catch(e => this._alertService.showError(e.message));
  }

  private _unsubOwner() {
    this._auctionsService.unsubscribeFromBids(this.auction)
      .catch(e => this._alertService.showError(e.message));
  }

  private _subParticipant() {
    return this._auctionsService.subscribeForStatusUpdates(this.currentUser._id, (update) => {
      this._onAuctionStateUpdate(update);
    });
  }

  private _unsubParticipant() {
    this._auctionsService.unsubscribeFromStatusUpdates(this.currentUser._id);
  }

  private _onReceivedBid(bid: BidMessage) {
    this.bids[bid.fromUser] = bid.bid;
    let newPrice = +this._alertService.getUserInput('Enter new asking price');
    if (!isNumber(newPrice) || newPrice <= bid.bid || newPrice < this.auction.currentBid) {
      newPrice = Math.max(bid.bid, this.auction.currentBid) + constants.auctionMinStep;
      this._alertService.showMessage(`Using default: ${newPrice}`, 'Invalid new ask price');
    }
    this.newAskPrice = newPrice;
    this.acceptBid(bid.fromUser);
  }

  private _onAuctionStateUpdate(msg: StreamMessage) {
    if (msg.type === StreamMessageType.AuctionEnd) {
      this._handleAuctionEnd(msg as AuctionEndMessage);
    } else if (msg.type === StreamMessageType.Error) {
      this._handleErrorMessage(msg as ErrorMessage);
    }
  }

  private _handleAuctionEnd(endMsg: AuctionEndMessage) {
    let title = 'The auction has ended.';
    let text = 'Unfortunately, someone else won.';

    if (endMsg.winner === this.currentUser._id) {
      text = `You won ${this.auction.item}`;
    } else if (Array.isArray(endMsg.winner)) {
      text = `You and ${endMsg.winner.length - 1} more people won.\nContact auction organizer for details on delivery`;
    } else if (!endMsg.winner) {
      title = 'The auction was cancelled';
      text = 'The auction organizer cancelled the auction.';
    }

    this._alertService.showMessage(text, title);
  }

  private _handleErrorMessage(msg: ErrorMessage) {
    this._alertService.showError(msg.error);
  }

  private _isAuctionStartEvent(newAuction: Auction) {
    return this.auction.start !== newAuction.start;
  }
}
