import { Kinvey } from 'kinvey-angular2-sdk';

export interface Auction extends Kinvey.Entity {
  item: string,
  currentBid: number,
  participants?: string[];
  start?: string,
  end?: string
}
