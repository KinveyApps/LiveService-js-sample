import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { AuctionsService, UsersService, AlertService } from '../services';
import { Auction, User, BidMessage } from '../models';

import { userIsOwner, constants } from '../shared';

@Component({
  selector: 'auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css']
})
export class AuctionComponent implements OnInit {
  private _paramSub: Subscription;
  private _currentUser: User;
  newUserBid: number;
  userBid: number = null;

  liveAuction: Observable<Auction>;
  auction: Auction;

  bids: { [userId: string]: number } = {};

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
        this.auction = auction;
        this.newUserBid = this.auction.currentBid + constants.auctionMinStep;
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

  startAuction() {
    const confirmed = this._alertService.askConfirmation(`Start auction for ${this.auction.item}?`);
    if (confirmed) {
      this._auctionsService.startAuction(this.auction, () => {

      })
        .catch(e => this._alertService.showError(e.message));
    }
  }

  userHasRegistered() {
    return this._auctionsService.userIsRegistered(this.currentUser._id, this.auction);
  }

  register() {
    this._auctionsService.registerForAuction(this.auction, this.currentUser._id)
      .catch(e => this._alertService.showError(e.message));
  }

  unregister() {
    const confirmed = this._alertService.askConfirmation(`Unregister from the auction for ${this.auction.item}?`);
    if (confirmed) {
      this._auctionsService.unregisterFromAuction(this.auction, this.currentUser._id)
        .catch(e => this._alertService.showError(e.message));
    }
  }

  submitBid() {
    console.log('submit bid of ' + this.newUserBid);
    this._auctionsService.bidOnAuction(this.auction, this.currentUser._id, this.newUserBid);
  }

  finishAuction() {
    const msg = `Finish auction for ${this.auction.item} and accept bid of $${this.auction.currentBid}?`;
    const confirmed = this._alertService.askConfirmation(msg);
    if (confirmed) {
      this._auctionsService.finishAuction(this.auction)
        .catch(e => this._alertService.showError(e.message));
    }
  }

  deleteAuction() {
    if (this._alertService.askConfirmation('Are you sure you want to delete this auction?')) {
      this._auctionsService.delete(this.auction._id)
        .then(() => this._router.navigateByUrl('/home'))
        .catch(e => this._alertService.showError(e.message));
    }
  }

  ngOnDestroy() {
    if (this._paramSub) {
      this._paramSub.unsubscribe();
    }
    this._auctionsService.unsubscribeFromAuctionUpdates();
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

  getMinBid() {
    return this.auction.currentBid + constants.auctionMinStep;
  }

  isHighestBidder() {
    return !this.isOwner() && this.userBid !== null && this.userBid === this.auction.currentBid;
  }

  private onReceivedBid(bid: BidMessage) {

  }
}
