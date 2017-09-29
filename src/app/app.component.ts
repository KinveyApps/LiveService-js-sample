import { Component, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { UsersService, AlertService, LiveDataService } from './services';

@Component({
  selector: 'app',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnDestroy {
  isLoggedIn: boolean;

  constructor(
    private _liveDataService: LiveDataService,
    private _usersService: UsersService,
    private _alertService: AlertService,
    private _router: Router,
    private _zone: NgZone
  ) {
    this._router.events.subscribe(e => {
      this._zone.run(() => {
        this.isLoggedIn = this._usersService.isUserLoggedIn();
      });
    })
  }

  logout() {
    this._usersService.logoutUser()
      .then(() => this._router.navigateByUrl('/login'))
      .catch(e => this._alertService.showError(e.message));
  }

  ngOnDestroy() {
    this._liveDataService.uninitialize();
  }
}
