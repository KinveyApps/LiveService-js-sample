import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import CustomValidators from '../forms/CustomValidators';

import {
  // KinveyService,
  AuctionsService
} from '../services';
import { Auction } from '../models';

@Component({
  selector: 'auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css']
})
export class AuctionComponent implements OnInit {
  // contactForm: FormGroup;
  // constructor(private formBuilder: FormBuilder) {}
  private _paramSub;

  auction: Promise<Auction>;

  constructor(
    private _route: ActivatedRoute,
    private _auctionsService: AuctionsService,
  ) { }

  ngOnInit() {
    this._paramSub = this._route.params.subscribe(p => {
      const id = p.id;
      this.auction = this._auctionsService.getById(id);
    })
    // this.contactForm = this.formBuilder.group({
    //   name: ['', Validators.required],
    //   email: ['', [Validators.required, CustomValidators.validateEmail]],
    //   content: ['', [Validators.required, Validators.minLength(10)]]
    // });
  }

  ngOnDestroy() {
    if (this._paramSub) {
      this._paramSub.unsubscribe();
    }
  }
}
