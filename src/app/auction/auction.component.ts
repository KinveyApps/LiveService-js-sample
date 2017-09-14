import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { AuctionsService, UsersService, AlertService } from '../services';
import { Auction, User, BidMessage, StreamMessage } from '../models';

import { userIsOwner, constants } from '../shared';

@Component({
  selector: 'auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css']
})
export class AuctionComponent implements OnInit {
  private _paramSub: Subscription;
  private _currentUser: User;
  private _bidderIdCounter = 1;

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
        const isUpdate = !!this.auction;

        this.auction = auction;
        this.newUserBid = this.getMinBid();
        this.newAskPrice = this.getMinBid();

        if (!isUpdate) {
          this._subForUserRoleData()
            .catch(e => e && this._alertService.showError(e.message));
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
    return this.newUserBid < this.getMinBid() || this.newUserBid < this.userBid;
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

  submitBid() {
    this._auctionsService.bidOnAuction(this.auction, this.currentUser._id, this.newUserBid);
  }

  finishAuction() {
    const msg = `Finish auction for ${this.auction.item} and accept bid of $${this.auction.currentBid}?`;
    this._alertService.askConfirmation(msg)
      .then(() => this._auctionsService.finishAuction(this.auction))
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
    // TODO: unsub from auction streams
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
        console.log('successfully bid ' + this.newUserBid);
        this.userBid = this.newUserBid;
      })
      .catch(e => this._alertService.showError(e.message));
  }

  acceptBid(bidderId: string) {
    const acceptedBid = this.bids[bidderId];
    if (this.newAskPrice < acceptedBid) {
      return this._alertService.showError('New asking price cannot be lower than the accepted bid');
    }
    
    this._auctionsService.acceptBidOnAuction(this.auction, bidderId, acceptedBid, this.newAskPrice)
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
    console.log('subbing owner');
    return this._auctionsService.subscribeForBids(this.auction, (bidMsg) => {
      this._onReceivedBid(bidMsg);
    });
  }

  private _subParticipant() {
    console.log('subbing participant');
    return this._auctionsService.subscribeForStatusUpdates(this.auction, this.currentUser._id, (update) => {
      this._onAuctionStateUpdate(update);
    });
  }

  private _onReceivedBid(bid: BidMessage) {
    console.log('recieved bid', bid);
    this.bids[bid.fromUser] = bid.bid;
  }

  private _onAuctionStateUpdate(msg: StreamMessage) {
    console.log('auction state change: ', msg);
  }
}
