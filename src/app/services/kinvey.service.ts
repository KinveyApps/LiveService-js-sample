import { Injectable } from '@angular/core';

import { Kinvey } from 'kinvey-angular2-sdk';
import { Stream } from '../models';

@Injectable()
export class KinveyService {
  private _isLoggedIn = false;

  constructor() {
    Kinvey.initialize({
      appKey: 'kid_SJsSMfnGZ',
      appSecret: 'ea0cc05888be46b2b1ff729b2f7de3d8'
    });
  }

  private get LiveService() {
    return (Kinvey as any).LiveService;
  }

  // invokeCustomEndpoint(endpoint: string, body: any) {
  //   return Kinvey.CustomEndpoint.execute(endpoint, body);
  // }

  getActiveUser() {
    return Kinvey.User.getActiveUser();
  }

  userLookup(query: Kinvey.Query) {
    return Kinvey.User.lookup(query);
  }

  loginUser(creds: { username: string, password: string }) {
    return Kinvey.User.login(creds.username, creds.password);
  }

  logoutUser() {
    return Kinvey.User.logout();
  }

  signUpUser(creds: { username: string, password: string }) {
    return Kinvey.User.signup(creds);
  }

  liveServiceInitialized(): boolean {
    return this.LiveService.isInitialized();
  }

  initLiveService(): Promise<void> {
    const user = Kinvey.User.getActiveUser() as any;
    if (user) {
      return user.registerForLiveService();
    }
    return Promise.reject(new Error('No active user'));
  }

  uninitializeLiveService() {
    const user = Kinvey.User.getActiveUser() as any;
    if (user) {
      return user.unregisterFromLiveService();
    }
    return Promise.resolve();
  }

  getNewStream(name: string): Stream {
    return (Kinvey as any).LiveService.Stream(name);
  }

  getNewCollection<T extends Kinvey.Entity>(name: string) {
    return Kinvey.DataStore.collection<T>(name, Kinvey.DataStoreType.Network); // parametarize type?
  }

  getNewQuery() {
    return new Kinvey.Query();
  }

  // getLiveCollection(collection: Kinvey.CacheStore<Kinvey.Entity>)
  // getLiveCollection(collection: string)
  // getLiveCollection(collection: Kinvey.CacheStore<Kinvey.Entity> | string) {
  //   if (typeof collection === 'string') {
  //     collection = this.getNewCollection(collection);
  //   }

  //   (collection as any).subscribe({
  //     onMessage: () => {
  //       console.log(this);
  //     }
  //   });


  // }
}
