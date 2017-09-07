import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/merge';

import { Kinvey } from 'kinvey-angular2-sdk';

import { KinveyService } from './kinvey.service';
import { LiveDataService } from './live-data.service';
import { Auction } from '../models';

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

  subscribeForAuctionUpdates(auctionId?: string): Observable<Auction|Auction[]>
  subscribeForAuctionUpdates(auctions?: Auction[]): Observable<Auction|Auction[]>
  subscribeForAuctionUpdates(auctionIds?: string | Auction[]): Observable<Auction|Auction[]> {
    let filter: { _id: string }[] = null;
    if (auctionIds) {
      filter = Array.isArray(auctionIds) ? auctionIds : [{ _id: auctionIds }];
    }
    const subObs = this._liveDataService.subscribeForCollectionUpdates<Auction>(collectionName, filter)
    const query = this._kinveyService.getNewQuery()
      .contains('_id', filter.map(f => f._id));

    const prm = this.getWithQuery(query)
      .then(res => {
        if (typeof auctionIds === 'string') {
          return res && res[0];
        }
        return res;
      })
    const firstValueObs = Observable.fromPromise(prm);
    return firstValueObs.merge(subObs);
  }

  unsubscribeFromAuctionUpdates() {
    return this._liveDataService.unsubscribeFromCollection(collectionName);
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
