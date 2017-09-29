import { Component, Input } from '@angular/core';

import { AuctionsService } from '../../services';
import { Auction } from '../../models';

@Component({
  selector: '[auction-list-item]',
  styleUrls: ['./auction-list-item.component.css'],
  templateUrl: './auction-list-item.component.html'
})
export class AuctionListItemComponent {
  @Input()
  auction: Auction;

  constructor(
    private _auctionsService: AuctionsService
  ) { }

  getParticipantCount(auction: Auction) {
    return (auction && auction.participants) ? auction.participants.length : 0;
  }
}
