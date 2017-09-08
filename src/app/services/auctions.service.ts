import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/map';

import { Kinvey } from 'kinvey-angular2-sdk';

import { KinveyService } from './kinvey.service';
import { LiveDataService } from './live-data.service';
import { Auction } from '../models';
import { isNonemptyString, cloneObject } from '../shared';

const collectionName = 'Auctions';

@Injectable()
export class AuctionsService {
  private _auctions: Kinvey.CacheStore<Auction>;

  constructor(
    private _kinveyService: KinveyService,
    private _liveDataService: LiveDataService
  ) {
    this._auctions = _kinveyService.getNewCollection<Auction>(collectionName);
  }

  getAll() {
    return this.getWithQuery();
  }

  getWithQuery(query?: Kinvey.Query) {
    const obs = this._auctions.find(query);
    return this._wrapInNativePromise(obs);
  }

  getById(id: string) {
    const obs = this._auctions.findById(id);
    return this._wrapInNativePromise(obs);
  }

  subscribeForAuctionAndUpdates(auctionId?: string): Observable<Auction>
  subscribeForAuctionAndUpdates(auction?: Auction): Observable<Auction[]>
  subscribeForAuctionAndUpdates(identifier?: string | Auction): Observable<Auction | Auction[]> {
    const filter = typeof identifier === 'string' ? [{ _id: identifier }] : [identifier];
    return this.subscribeToAuctionCollectionWithInitialValue(filter)
      .map(arr => {
        if (Array.isArray(arr) && arr.length === 1) {
          // is initial value from given filter by id
          return arr[0];
        }
        return arr;
      });
  }

  subscribeToAuctionCollectionWithInitialValue(interestedIn: { _id: string }[]) {
    const query = this._kinveyService.getNewQuery()
      .contains('_id', interestedIn.map(f => f._id));

    const prm = this.getWithQuery(query);
    const firstValueObs = Observable.fromPromise(prm);
    const subObs = this.subscribeToAuctionCollection(interestedIn);
    return firstValueObs.merge(subObs);
  }

  subscribeToAuctionCollection(interestedIn: { _id: string }[]) {
    return this._liveDataService.subscribeForCollectionUpdates<Auction>(collectionName, interestedIn);
  }

  unsubscribeFromAuctionUpdates() {
    return this._liveDataService.unsubscribeFromCollection(collectionName);
  }

  create(auction: Auction) {
    return this._auctions.save(auction);
  }

  delete(auctionId: string) {
    return this._auctions.removeById(auctionId);
  }

  startAuction(auction: Auction) {
    const copy = cloneObject(auction);
    copy.start = new Date().toISOString();
    return this._auctions.update(copy);
  }

  finishAuction(auction: Auction) {
    const copy = cloneObject(auction);
    copy.end = new Date().toISOString();
    return this._auctions.update(copy);
  }

  validateAuctionData(auction: any) {
    let errorMsg: string = null;

    if (!isNonemptyString(auction.item)) {
      errorMsg = 'Invalid auction item';
    }

    if (typeof auction.currentBid !== 'number' || auction.currentBid < 0) {
      errorMsg = 'Invalid starting bid';
    }

    return errorMsg;
  }

  private _wrapInNativePromise<T>(promise: Promise<T>): Promise<T>
  private _wrapInNativePromise<T>(promise: Observable<T>): Promise<T>
  private _wrapInNativePromise<T>(asyncTask: Promise<T> | Observable<T>): Promise<T> {
    const task = asyncTask as any;
    const promise: Promise<any> = task.then ? task : task.toPromise();

    return new Promise((resolve, reject) => {
      promise.then(resolve, reject);
    });
  }
}
