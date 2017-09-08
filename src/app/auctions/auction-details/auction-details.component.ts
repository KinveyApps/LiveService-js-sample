import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { AuctionsService, UsersService, AlertService } from '../../services';
import { Auction } from '../../models';

import { userIsOwner } from '../../shared';

@Component({
  selector: 'auction-details',
  styleUrls: ['./auction-details.component.css'],
  templateUrl: './auction-details.component.html'
})
export class AuctionDetailsComponent {
  @Input()
  auction: Auction;
}
