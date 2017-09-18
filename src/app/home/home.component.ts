import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';

import { KinveyService, AuctionsService } from '../services';
import { Auction } from '../models';

@Component({
  selector: 'home',
  styleUrls: ['./home.component.css'],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  auctions: any;

  constructor(
    private _kinveyService: KinveyService,
    private _auctionsService: AuctionsService,
    private _router: Router,
    private _cdRef: ChangeDetectorRef,
    private _zone: NgZone
  ) { }

  ngOnInit() {
    this.auctions = this._auctionsService.getAll();
  }

  viewDetails(id: string) {
    this._router.navigateByUrl(`/auctions/${id}`);
  }

  getParticipantCount(auction: Auction) {
    const participants = auction.participants || [];
    return participants.length;
  }
}
