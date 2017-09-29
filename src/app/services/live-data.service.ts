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

  keepCollectionUpdated<T extends Entity>(collectionName: string, initialCollection: Observable<T[]>, interestedIn?: { _id: string }[]) {
    return new Observable<T[]>((observer: any) => {
      let collection: T[] = null;

      initialCollection.subscribe((initialCollection) => {
        collection = initialCollection;
        observer.next(collection);

        this.subscribeForCollectionUpdates<T>(collectionName, interestedIn).subscribe((entityUpdate) => {
          const ind = collection.findIndex(e => e._id === entityUpdate._id);
          if (ind > -1) {
            this._zone.run(() => {
              collection[ind] = entityUpdate;
            });
          } else {
            collection.push(entityUpdate);
          }
          observer.next(collection);
        });
      });
    });
  }

  subscribeForCollectionUpdates<T extends Entity>(collectionName: string, interestedIn?: Entity[]): Observable<T> {
    this._subForCollection(collectionName);
    const obs = this.updatesByCollection[collectionName].asObservable() as Observable<T>;

    return obs.filter((item) => {
      return !interestedIn || interestedIn.some(o => o._id === item._id);
    });
  }

  unsubscribeFromCollection(collectionName: string) {
    return this._unsubFromCollection(collectionName);
  }

  initialize() {
    return this._kinveyService.initLiveService();
  }

  uninitialize() {
    return this._kinveyService.uninitializeLiveService();
  }

  subscribeToStream(streamName: string, streamOwnerId: string, receiver: (msg: StreamMessage) => void) {
    const stream = this._getStream(streamName);
    return stream.follow(streamOwnerId, {
      onMessage: (m) => {
        this._zone.run(() => {
          receiver(m);
        });
      },
      onError: (e) => console.error(`Error on ${streamName} stream: `, e),
      onStatus: (s) => console.log(`Status update on ${streamName} stream: `, s)
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
    if (!this.streamsById[name]) {
      this.streamsById[name] = this._kinveyService.getNewStream(name);
    }
    return this.streamsById[name];
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
    return collection.subscribe({
      onMessage: (msg) => {
        this._zone.run(() => {
          subj.next(msg);
        });
      },
      onError: (e) => { console.error(`${collection.pathname} error: `, e); },
      onStatus: (s) => { console.log(`${collection.pathname} status: `, s); }
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
    return collection.unsubscribe();
  }
}
