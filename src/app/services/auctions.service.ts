import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Kinvey } from 'kinvey-angular2-sdk';

import { KinveyService } from './kinvey.service';
import { Auction } from '../models';

@Injectable()
export class AuctionsService {
  private _auctions: Kinvey.CacheStore<Auction>;

  constructor(
    private _kinveyService: KinveyService,
    private _zone: NgZone
  ) {
    this._auctions = _kinveyService.getNewCollection<Auction>('Auctions');
  }

  getAll() {
    const obs = this._auctions.find();
    return this._wrapInNativePromise(obs);

    // return new Observable((observer) => {
    //   (this._auctions.find() as any).toPromise()
    //     .then((res) => {
    //       observer.next(res);
    //     });
    // });

    // return new Promise((resolve, reject) => {
    //   (this._auctions.find() as any)
    //     .toPromise()
    //     .then(resolve, reject);
    // });

    // return new Observable((observer: any) => {
    // setTimeout(() => {
    //   observer.next([{ item: '1' }]);
    // }, 1000);

    // setTimeout(() => {
    //   observer.next([{ item: '2' }]);
    // }, 2000);

    // this._zone.run(() => {
    //   (this._auctions.find() as any).toPromise()
    //     .then((res) => {
    //       observer.next(res);
    //     });
    // });

    // setTimeout(() => {
    //   observer.complete();
    // }, 3000);
    // });
  }

  getById(id: string) {
    const obs = this._auctions.findById(id);
    return this._wrapInNativePromise(obs);
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
