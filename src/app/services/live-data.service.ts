import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

import { Kinvey } from 'kinvey-angular2-sdk';
import { Entity, Stream, CacheStore } from '../models';

import { KinveyService } from './kinvey.service';

@Injectable()
export class LiveDataService {
  private updatesByCollection: { [collName: string]: ReplaySubject<Entity> } = {};
  private streamsById: { [ownerId: string]: Stream } = {};

  constructor(
    private _kinveyService: KinveyService,
    private _zone: NgZone
  ) { }

  subscribeForCollectionUpdates<T extends Entity>(collectionName: string, interestedIn?: Entity[]): Observable<T> {
    if (!this.isSubbedForCollection(collectionName)) {
      this._subForCollection(collectionName);
    }

    return (this.updatesByCollection[collectionName].asObservable() as Observable<T>)
      .filter((item) => {
        return !interestedIn || interestedIn.some(o => o._id === item._id);
      });
  }

  unsubscribeFromCollection(collectionName: string) {
    if (this.isSubbedForCollection(collectionName)) {
      return this._unsubFromCollection(collectionName);
    }
    return Promise.resolve();
  }

  initialize() {
    return this._kinveyService.initLiveService();
  }

  uninitialize() {
    return this._kinveyService.uninitializeLiveService();
  }

  isSubbedForCollection(collectionName: string) {
    return !!this.updatesByCollection[collectionName];
  }

  subscribeToStream(streamName: string, streamOwnerId: string) {
    const stream = this._kinveyService.getNewStream(streamName);
    this.streamsById[streamOwnerId] = stream;
    // todo...
  }

  private _ensureLiveServiceInit() {
    let promise = Promise.resolve();
    if (!this._kinveyService.liveServiceInitialized()) {
      promise = this._kinveyService.initLiveService();
    }
    return promise;
  }

  private _subForCollection(collectionName: string) {
    const collection = this._kinveyService.getNewCollection(collectionName);
    const subj = new ReplaySubject<Entity>(1);
    this.updatesByCollection[collectionName] = subj;

    this._ensureLiveServiceInit()
      .then(() => {
        return this._subForLiveData(collection, subj);
      })
      .catch(e => {
        subj.error(e);
        delete this.updatesByCollection[collectionName];
      });
  }

  private _subForLiveData(collection: CacheStore<Entity>, subj: ReplaySubject<Entity>) {
    return (collection as any).subscribe({
      onMessage: (msg) => {
        this._zone.run(() => {
          subj.next(msg);
        });
      },
      onError: (e) => { console.log(`${collection.pathname} error: `, e); },
      onStatus: (status) => { console.log(`${collection.pathname} status: `, status); }
    });
  }

  private _unsubFromCollection(collectionName: string) {
    const collection = this._kinveyService.getNewCollection(collectionName);
    return this._unsubFromLiveData(collection)
      .then(() => {
        const subj = this.updatesByCollection[collectionName];
        subj.complete();
        delete this.updatesByCollection[collectionName];
      });
  }

  private _unsubFromLiveData(collection: CacheStore<Entity>) {
    return (collection as any).unsubscribe();
  }
}
