import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Auction } from '../models';
import { AuctionsService, AlertService } from '../services';

@Component({
  selector: 'new-auction',
  styleUrls: ['./new-auction.component.css'],
  templateUrl: './new-auction.component.html'
})
export class NewAuctionComponent {
  auction: Auction;

  constructor(
    private _auctionsService: AuctionsService,
    private _alertService: AlertService,
    private _router: Router
  ) {
    this.auction = {} as any;
  }

  createAuction() {
    const errMsg = this._auctionsService.validateAuctionData(this.auction);
    if (errMsg) {
      return this._alertService.showError(errMsg);
    }

    this._auctionsService.create(this.auction)
      .then((res) => this._router.navigateByUrl(`/auctions/${res._id}`))
      .catch(e => this._alertService.showError(e.message));
  }
}
