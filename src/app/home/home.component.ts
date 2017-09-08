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
    const auctions = [
      {
        _id: '1',
        item: 'item1',
        currentBid: 100,
        start: 'test start1',
        end: 'test end1'
      },
      {
        _id: '2',
        item: 'item2',
        currentBid: 200,
        start: 'test start2',
        end: 'test end2'
      }
    ];
    // this.auctions.subscribe(e => {
    //   console.log('e: ' + e);
    //   this._cdRef.detectChanges();
    // });
    // .then(res => {
    //   console.log(res);


    //   // return res;
    // });

    // this.auctions = this._auctionsService.getAll();
    // this.auctions.subscribe(e => {
    //   console.log('e', e);
    //   this._cdRef.detectChanges();
    // });
    // this.auctions = new Promise((resolve, reject) => {
    //   this._auctionsService.getAll()
    //     .then(res => resolve(res));
    // });

    this.auctions = this._auctionsService.getAll();

    // this._auctionsService.getAll()
    //   .then(res => this.auctions = res);
    // this.auctions = new Observable((observer) => {
    //   this._zone.run(() => {
    //     this._auctionsService.getAll()
    //       .then(res => observer.next(res))
    //   });
    //   // .then(() => this._cdRef.detectChanges());
    // });
  }

  // detect() {
  //   this._cdRef.detectChanges();
  // }

  viewDetails(id: string) {
    this._router.navigateByUrl(`/auctions/${id}`);
  }

  getParticipantCount(auction: Auction) {
    const participants = auction.participants || [];
    return participants.length;
  }
}
