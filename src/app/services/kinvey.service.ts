import { Injectable } from '@angular/core';

import { Kinvey } from 'kinvey-angular2-sdk';
import { Stream, NetworkStore } from '../models';

@Injectable()
export class KinveyService {
  private _isLoggedIn = false;

  constructor() {
    Kinvey.initialize({
      appKey: 'kid_SJsSMfnGZ',
      appSecret: 'ea0cc05888be46b2b1ff729b2f7de3d8'
    });
  }

  getActiveUser() {
    return Kinvey.User.getActiveUser();
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
    return Kinvey.LiveService.isInitialized();
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
    return Kinvey.DataStore.collection<T>(name, Kinvey.DataStoreType.Network) as NetworkStore<T>;
  }

  getNewQuery() {
    return new Kinvey.Query();
  }
}
