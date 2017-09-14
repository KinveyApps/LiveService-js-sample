import { Kinvey } from 'kinvey-angular2-sdk';

export * from './auction.model';
export * from './stream-message.model';

export type User = Kinvey.User;
export type Entity = Kinvey.Entity;
export type CacheStore<T extends Kinvey.Entity> = Kinvey.CacheStore<T>;
export type Query = Kinvey.Query;

export interface Stream {
  setACL(userId: string, acl: any): Promise<any>;
  follow(userId: string, receiver: any): Promise<any>;
  unfollow(userId: string): Promise<any>;
  post(message: any): Promise<any>;
  send(id: string, message: any): Promise<any>;
}
