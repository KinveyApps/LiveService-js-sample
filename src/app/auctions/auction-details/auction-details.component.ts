import { Component, Input, OnInit } from '@angular/core';

import { AuctionsService } from '../../services';
import { Auction } from '../../models';

@Component({
  selector: 'auction-details',
  styleUrls: ['./auction-details.component.css'],
  templateUrl: './auction-details.component.html'
})
export class AuctionDetailsComponent implements OnInit {
  @Input()
  auction: Auction;

  constructor(
    private _auctionsService: AuctionsService
  ) {
  }

  ngOnInit() {
    (window as any).test = () => this.auction;
  }
}
