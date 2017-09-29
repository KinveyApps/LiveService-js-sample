import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

import { KinveyService, AuctionsService } from '../services';
import { Auction } from '../models';

@Component({
  selector: 'home',
  styleUrls: ['./home.component.css'],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  auctions: Observable<Auction[]>;
  hasNoAuctions: boolean = false;

  constructor(
    private _kinveyService: KinveyService,
    private _auctionsService: AuctionsService,
    private _router: Router,
    private _cdRef: ChangeDetectorRef,
    private _zone: NgZone
  ) { }

  ngOnInit() {
    const obs = this._auctionsService.subscribeToAuctionCollectionWithInitialValue() as Observable<Auction[]>;
    this.auctions = obs.do((auctions) => {
      this.hasNoAuctions = auctions && !auctions.length;
    });
  }

  viewDetails(id: string) {
    this._router.navigateByUrl(`/auctions/${id}`);
  }

  getParticipantCount(auction: Auction) {
    const participants = auction.participants || [];
    return participants.length;
  }

  hasStarted(auction: Auction) {
    return auction.start && !auction.end;
  }

  hasEnded(auction: Auction) {
    return auction.start && auction.end;
  }

  isOngoing(auction: Auction) {
    return this.hasStarted(auction) && !this.hasEnded(auction);
  }
}
