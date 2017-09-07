import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuctionsService } from '../services';
import { Auction } from '../models';

@Component({
  selector: 'auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css']
})
export class AuctionComponent implements OnInit {
  private _paramSub;

  auction: Observable<Auction>;

  constructor(
    private _route: ActivatedRoute,
    private _auctionsService: AuctionsService,
  ) { }

  ngOnInit() {
    this._paramSub = this._route.params.subscribe(p => {
      this.auction = this._auctionsService.subscribeForAuctionUpdates(p.id);
    });
  }

  ngOnDestroy() {
    if (this._paramSub) {
      this._paramSub.unsubscribe();
    }
    this._auctionsService.unsubscribeFromAuctionUpdates();
  }
}
