import { Injectable } from '@angular/core';

@Injectable()
export class AlertService {
  askConfirmation(msg: string, title?: string) {
    const res = confirm(msg);
    if (res) {
      return Promise.resolve(res);
    } else {
      return Promise.reject(res);
    }
  }

  showError(msg: string, title?: string) {
    alert(msg);
  }
}
