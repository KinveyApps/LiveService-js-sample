import { Component, Input } from '@angular/core';

import { AuctionsService, AlertService, UsersService } from '../../services';
import { Auction } from '../../models';

import { userIsOwner } from '../../shared';

@Component({
  selector: 'auction-details',
  styleUrls: ['./auction-details.component.css'],
  templateUrl: './auction-details.component.html'
})
export class AuctionDetailsComponent {
  userBid: number;

  @Input()
  auction: Auction;

  constructor(
    private _auctionsService: AuctionsService,
    private _alertService: AlertService,
    private _usersService: UsersService
  ) { }

  getParticipants() {
    const participants = this.auction.participants || [];
    return participants.length;
  }

  isOngoing() {
    return this.auction && this.auction.start && !this.auction.end;
  }

  isOwner() {
    return userIsOwner(this._usersService.getCurrentUser(), this.auction);
  }
}
