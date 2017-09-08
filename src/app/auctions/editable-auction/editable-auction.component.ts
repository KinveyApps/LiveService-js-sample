import { Component, Input } from '@angular/core';

import { AuctionsService } from '../../services';
import { Auction } from '../../models';

@Component({
  selector: 'editable-auction',
  styleUrls: ['./editable-auction.component.css'],
  templateUrl: './editable-auction.component.html'
})
export class EditableAuctionComponent {
  @Input()
  auction: Auction;

  constructor(
    private _auctionsService: AuctionsService
  ) { }
}
