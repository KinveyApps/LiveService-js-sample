import { Routes } from '@angular/router';

import { AuthGuard, UnauthGuard } from './shared';

import { LoginComponent } from './login/login.component';
import { JoinComponent } from './join/join.component';
import { HomeComponent } from './home/home.component';
import { NewAuctionComponent } from './new-auction/new-auction.component';
import { AuctionComponent } from './auction/auction.component';
import { SignupComponent } from './signup/signup.component';

export const rootRouterConfig: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'auctions/:id', component: AuctionComponent, canActivate: [AuthGuard] },
  { path: 'new', component: NewAuctionComponent, canActivate: [AuthGuard] },
  { path: 'join', component: JoinComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [UnauthGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [UnauthGuard] },

  // { path: 'github', component: RepoBrowserComponent,
  //   children: [
  //     { path: '', component: RepoListComponent },
  //     { path: ':org', component: RepoListComponent,
  //       children: [
  //         { path: '', component: RepoDetailComponent },
  //         { path: ':repo', component: RepoDetailComponent }
  //       ]
  //     }]
  // }
];
