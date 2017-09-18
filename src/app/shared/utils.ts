import { NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/fromPromise';

import { User } from '../models';

export function isNonemptyString(o) {
  return typeof o === 'string' && o !== '';
}

export function isNumber(o: any) {
  return typeof o === 'number' && !Number.isNaN(o);
}

// { _acl: { creator: string } }
export function userIsOwner(user: User, entity: any);
export function userIsOwner(userId: string, entity: any);
export function userIsOwner(userId: string | User, entity: any) {
  const id = (typeof userId === 'string') ? userId : userId._acl.creator;
  return !!userId && entity._acl.creator === id;
}

export function cloneObject<T>(o: T): T {
  const copy = {} as any;
  for (let key in o) {
    if (Array.isArray(o[key])) {
      copy[key] = (o[key] as any).slice(0);
    } else if (typeof o[key] === 'object') {
      copy[key] = cloneObject(o[key]);
    } else {
      copy[key] = o[key];
    }
  }
  return copy;
}

export function makeObservableZoneAware<T>(zone: NgZone, obs: Observable<T>): Observable<T> {
  return new Observable((observer) => {
    obs.subscribe(n => {
      zone.run(() => {
        observer.next(n as any);
      });
    }, e => {
      zone.run(() => {
        observer.error(e);
      });
    }, () => {
      observer.complete();
    });
  });
}

export function makePromiseZoneAware<T>(zone: NgZone, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    promise.then(res => {
      zone.run(() => {
        resolve(res);
      });
    })
      .catch(err => {
        zone.run(() => {
          reject(err);
        });
      });
  });
}

export function ensureChangeDetection<T>(zone: NgZone, promise: Promise<T>)
export function ensureChangeDetection<T>(zone: NgZone, observable: Observable<T>)
export function ensureChangeDetection<T>(zone: NgZone, asyncTask: Promise<T> | Observable<T>): Promise<T> | Observable<T> {
  if (asyncTask instanceof Promise) {
    return makePromiseZoneAware(zone, asyncTask);
  } else {
    return makeObservableZoneAware(zone, asyncTask);
  }
}
