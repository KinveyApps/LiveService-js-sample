import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivate } from '@angular/router';
import 'rxjs/add/operator/do';

import { UsersService } from '../services';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private _usersService: UsersService,
    private _router: Router
  ) { }

  canActivate() {
    return this._usersService.authEvents()
      .do(isLoggedIn => {
        if (!isLoggedIn) {
          this._router.navigateByUrl('/login');
        }
      });
  }
}
