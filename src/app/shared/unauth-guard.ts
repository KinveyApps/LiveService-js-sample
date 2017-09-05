import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivate } from '@angular/router';
import 'rxjs/add/operator/map';

import { UsersService } from '../services';

@Injectable()
export class UnauthGuard implements CanActivate {

  constructor(
    private _usersService: UsersService,
    private _router: Router
  ) { }

  canActivate() {
    return this._usersService.authEvents()
      .map(isLoggedIn => {
        if (isLoggedIn) {
          this._router.navigateByUrl('/home');
        }
        return !isLoggedIn;
      });
  }
}
