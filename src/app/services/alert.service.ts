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

  showMessage(msg: string, title?: string) {
    let text = '';
    if (title) {
      text = title + '\n\n';
    }
    text += msg;
    alert(text);
  }

  getUserInput(question: string) {
    return prompt(question);
  }
}
