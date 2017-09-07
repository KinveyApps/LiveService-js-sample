import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { UsersService, AlertService } from '../services';

@Component({
  selector: 'login',
  styleUrls: ['./login.component.css'],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  user: { username: string, password: string } = {} as any;

  constructor(
    private _usersService: UsersService,
    private _router: Router,
    private _alertService: AlertService
  ) { }

  logIn() {
    this._usersService.loginUser(this.user)
      .then(() => this._router.navigateByUrl('/home'))
      .catch(err => this._alertService.showError(err.message));
  }
}
