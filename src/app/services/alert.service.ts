import { Injectable } from '@angular/core';

@Injectable()
export class AlertService {
  askConfirmation(msg: string, title?: string) {
    return confirm(msg);
  }

  showError(msg: string, title?: string) {
    alert(msg);
  }
}
