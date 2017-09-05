import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
// import { Subscriber } from 'rxjs/Subscriber';

import { Kinvey } from 'kinvey-angular2-sdk';

// TODO: separate into different services
@Injectable()
export class KinveyService {
  private _isLoggedIn = false;

  constructor() {
    Kinvey.initialize({
      appKey: 'kid_SJsSMfnGZ',
      appSecret: 'ea0cc05888be46b2b1ff729b2f7de3d8'
    });
  }

  get LiveService() {
    return (Kinvey as any).LiveService;
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

  initLiveService(): Promise<void> {
    const user = Kinvey.User.getActiveUser() as any;
    if (user) {
      return user.registerForLiveService();
    }
    return Promise.reject(new Error('No active user'));
  }

  getNewStream(name: string) {
    return (Kinvey as any).LiveService.Stream(name);
  }

  getNewCollection<T extends Kinvey.Entity>(name: string) {
    return Kinvey.DataStore.collection<T>(name, Kinvey.DataStoreType.Network); // parametarize type?
  }

  getLiveCollection(collection: Kinvey.CacheStore<Kinvey.Entity>)
  getLiveCollection(collection: string)
  getLiveCollection(collection: Kinvey.CacheStore<Kinvey.Entity> | string) {
    if (typeof collection === 'string') {
      collection = this.getNewCollection(collection);
    }

    (collection as any).subscribe({
      onMessage: () => {
        console.log(this);
      }
    });


  }
}
