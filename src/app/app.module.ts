import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router';
import { rootRouterConfig } from './app.routes';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';

import { AuthGuard, UnauthGuard } from './shared';
import {
  KinveyService,
  AlertService,
  AuctionsService,
  UsersService,
  LiveDataService
} from './services';

import { LoginComponent } from './login/login.component';
import { AuctionComponent } from './auction/auction.component';
import { HomeComponent } from './home/home.component';
import { NewAuctionComponent } from './new-auction/new-auction.component';
import { SignupComponent } from './signup/signup.component';
import {
  AuctionDetailsComponent,
  AuctionListItemComponent,
  EditableAuctionComponent
} from './auctions';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AuctionComponent,
    NewAuctionComponent,
    LoginComponent,
    SignupComponent,
    AuctionDetailsComponent,
    AuctionListItemComponent,
    EditableAuctionComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: true })
  ],
  providers: [
    KinveyService,
    AlertService,
    AuctionsService,
    LiveDataService,
    UsersService,
    AuthGuard,
    UnauthGuard
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
