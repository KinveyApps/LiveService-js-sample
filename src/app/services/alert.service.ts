import { Injectable } from '@angular/core';

@Injectable()
export class AlertService {
  showSuccess(msg: string, title?: string) {
    alert(msg);
  }

  showError(msg: string, title?: string) {
    alert(msg);
  }
}
