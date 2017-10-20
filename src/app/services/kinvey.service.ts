import { Injectable } from '@angular/core';

import { Kinvey } from 'kinvey-angular2-sdk';
import { Stream } from '../models';

@Injectable()
export class KinveyService {
  private _isLoggedIn = false;

  constructor() {
    Kinvey.initialize({
      appKey: 'kid_rkVww13j-',
      appSecret: 'bd3513fa3ad04db884b0368d1d896c0d'
    });
  }

  private get LiveService() {
    return Kinvey.LiveService;
  }

  getActiveUser() {
    return Kinvey.User.getActiveUser();
  }

  userLookup(username: string) {
    const query = this.getNewQuery()
      .equalTo('username', username)
    return Kinvey.User.lookup(query);
  }

  // TODO: move user functions to users service
  loginUser(creds: { username: string, password: string }) {
    return Kinvey.User.login(creds.username, creds.password);
  }

  logoutUser() {
    return Kinvey.User.logout();
  }

  signUpUser(creds: { username: string, password: string }) {
    return Kinvey.User.signup(creds);
  }

  initLiveService(): Promise<void> {
    const user = Kinvey.User.getActiveUser();
    if (user) {
      return user.registerForLiveService();
    }
    return Promise.reject(new Error('No active user'));
  }

  uninitializeLiveService() {
    const user = Kinvey.User.getActiveUser();
    if (user) {
      return user.unregisterFromLiveService();
    }
    return Promise.resolve();
  }

  getNewStream(name: string): Stream {
    return new Kinvey.LiveService.Stream(name);
  }

  getNewCollection<T extends Kinvey.Entity>(name: string) {
    return Kinvey.DataStore.collection<T>(name, Kinvey.DataStoreType.Network); // parametarize type?
  }

  getNewQuery() {
    return new Kinvey.Query();
  }
}
