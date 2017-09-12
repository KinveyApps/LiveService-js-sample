import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

import { Kinvey } from 'kinvey-angular2-sdk';
import { Entity, Stream, CacheStore, StreamMessage } from '../models';

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

  // subscribeToStream(streamName: string) {
  //   const stream = this._kinveyService.getNewStream(streamName);
  //   this.streamsById[streamName] = stream;
  // }

  subscribeToStream(streamName: string, streamOwnerId: string, receiver: (msg) => void) {
    const stream = this._getStream(streamName);
    return stream.follow(streamOwnerId, {
      onMessage: (m) => receiver(m),
      onError: (e) => console.log(e),
      onStatus: (s) => console.log(s)
    });
  }

  // Stream actions don't check for live service init. maybe todo?
  setStreamACL(streamName: string, streamOwnerId: string, aclObj: any) {
    const stream = this._getStream(streamName);
    return stream.setACL(streamOwnerId, aclObj);
  }

  publishToStream(streamName: string, streamOwnerId: string, message: StreamMessage) {
    const stream = this._getStream(streamName);
    return stream.send(streamOwnerId, message);
  }

  unsubscribeFromStream(streamName: string, streamOwnerId: string) {
    const stream = this._getStream(streamName);
    return stream.unfollow(streamOwnerId);
  }

  private _getStream(name: string) {
    // is this even necessary?
    if (!this.streamsById[name]) {
      this.streamsById[name] = this._kinveyService.getNewStream(name);
    }
    return this.streamsById[name];
  }

  // private _isSubbed(name: string) {
  //   return !!this._getSubbedStream(name);
  // }

  // private _ensureStream(streamName: string, ownerId: string) {
  //   if (!this._isSubbed(ownerId)) {
  //     this.subscribeToStream(streamName, ownerId);
  //   }
  //   return this._getSubbedStream(ownerId);
  // }

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
