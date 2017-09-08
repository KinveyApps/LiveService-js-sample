import { Component, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { Observable } from 'rxjs/Observable';

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
    private _zone: NgZone,
    private _cdRef: ChangeDetectorRef
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

  detectChanges() {
    this._cdRef.detectChanges();
  }
}
