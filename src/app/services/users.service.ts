import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { KinveyService } from './kinvey.service';
import { wrapInNativePromise } from '../shared';
import { Query } from '../models';

@Injectable()
export class UsersService {
  private _authEventsSub: ReplaySubject<boolean>;

  constructor(
    private _kinveyService: KinveyService
  ) {}

  signUpUser(creds: { username: string, password: string }) {
    return this._kinveyService.signUpUser(creds)
      .then((resp) => {
        this._notifyAuthObservers(true);
        return resp;
      });
  }

  isUserLoggedIn() {
    return !!this.getCurrentUser();
  }

  getCurrentUser() {
    return this._kinveyService.getActiveUser();
  }

  getWithQuery(query: Query) {
    const obs = this._kinveyService.userLookup(query);
    return wrapInNativePromise(obs);
  }

  loginUser(creds: { username: string, password: string }) {
    return this._kinveyService.loginUser(creds)
      .then(resp => {
        this._notifyAuthObservers(true);
        return resp;
      });
  }

  logoutUser() {
    return this._kinveyService.logoutUser()
      .then(() => this._notifyAuthObservers(false));
  }

  authEvents() {
    // return new Observable<boolean>((subscriber) => {
    //   this._authEventsSub = subscriber;
    //   this._notifAuthObservers(false);
    // });
    if (!this._authEventsSub) {
      this._authEventsSub = new ReplaySubject<boolean>(1);
      this._authEventsSub.next(!!this._kinveyService.getActiveUser());
    }
    return this._authEventsSub.asObservable();
  }

  private _notifyAuthObservers(newState: boolean) {
    if (this._authEventsSub) {
      this._authEventsSub.next(newState);
    }
  }
}
