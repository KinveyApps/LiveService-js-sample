import { Component, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { Observable } from 'rxjs/Observable';

import { UsersService, AlertService } from './services';

@Component({
  selector: 'app',
  templateUrl: './app.component.html'
})
export class AppComponent {
  isLoggedIn: boolean;

  constructor(
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
      .catch(e => this._alertService.showMessage(e.message));
  }
}
