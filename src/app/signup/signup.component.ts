import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { UsersService, AlertService } from '../services';

@Component({
  selector: 'signup',
  styleUrls: ['./signup.component.css'],
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  user: { username: string, password: string, repeatPassword: string } = {} as any;

  constructor(
    private _usersService: UsersService,
    private _router: Router,
    private _alertService: AlertService
  ) { }

  signUp() {
    if (this.user.password !== this.user.repeatPassword) {
      return this._alertService.showError('Passwords do not match');
    }

    if (this.user.username === '' || this.user.password === '') {
      return this._alertService.showError('Invalid username or password');
    }

    delete this.user.repeatPassword;
    this._usersService.signUpUser(this.user)
      .then(() => this._router.navigateByUrl('/home'))
      .catch(err => this._alertService.showError(err.message));
  }
}
