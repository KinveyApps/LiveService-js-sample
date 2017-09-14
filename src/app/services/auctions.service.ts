import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/map';

import { Kinvey } from 'kinvey-angular2-sdk';

import { KinveyService } from './kinvey.service';
import { UsersService } from './users.service';
import { LiveDataService } from './live-data.service';
import { Auction, BidMessage, StreamMessage, StreamMessageType } from '../models';
import { isNonemptyString, cloneObject, wrapInNativePromise } from '../shared';

const collectionName = 'Auctions';
const streamName = collectionName;

@Injectable()
export class AuctionsService {
  private _auctions: Kinvey.CacheStore<Auction>;

  constructor(
    private _kinveyService: KinveyService,
    private _liveDataService: LiveDataService,
    private _usersService: UsersService
  ) {
    this._auctions = _kinveyService.getNewCollection<Auction>(collectionName);
  }

  getAll() {
    return this.getWithQuery();
  }

  getWithQuery(query?: Kinvey.Query) {
    const obs = this._auctions.find(query);
    return wrapInNativePromise(obs);
  }

  getById(id: string) {
    const obs = this._auctions.findById(id);
    return wrapInNativePromise(obs);
  }

  subscribeForAuctionAndUpdates(auctionId?: string): Observable<Auction>
  subscribeForAuctionAndUpdates(auction?: Auction): Observable<Auction[]>
  subscribeForAuctionAndUpdates(identifier?: string | Auction): Observable<Auction | Auction[]> {
    const filter = typeof identifier === 'string' ? [{ _id: identifier }] : [identifier];
    return this.subscribeToAuctionCollectionWithInitialValue(filter)
      .map(arr => {
        if (Array.isArray(arr) && arr.length === 1) {
          // is initial value from given filter by id
          return arr[0];
        }
        return arr;
      });
  }

  subscribeToAuctionCollectionWithInitialValue(interestedIn: { _id: string }[]) {
    const query = this._kinveyService.getNewQuery()
      .contains('_id', interestedIn.map(f => f._id));

    const prm = this.getWithQuery(query);
    const firstValueObs = Observable.fromPromise(prm);
    const subObs = this.subscribeToAuctionCollection(interestedIn);
    return firstValueObs.merge(subObs);
  }

  subscribeToAuctionCollection(interestedIn: { _id: string }[]) {
    return this._liveDataService.subscribeForCollectionUpdates<Auction>(collectionName, interestedIn);
  }

  unsubscribeFromAuctionUpdates() {
    return this._liveDataService.unsubscribeFromCollection(collectionName);
  }

  create(auction: Auction) {
    return this._auctions.save(auction);
  }

  delete(auctionId: string) {
    return this._auctions.removeById(auctionId);
  }

  startAuction(auction: Auction /* , onBids: (bid: BidMessage) => void */) {
    const copy = cloneObject(auction);
    copy.start = new Date().toISOString();
    const updatePromise = this._auctions.update(copy);
    // const streamPromises = this.subscribeToParticipantStreams(auction, onBids);
    // return Promise.all(streamPromises.concat(updatePromise));
    return updatePromise;
  }

  subscribeForBids(auction: Auction, onBids: (bid: BidMessage) => void) {
    const promises = auction.participants.map(participantId => {
      return this._liveDataService.subscribeToStream(streamName, participantId, (msg: BidMessage) => {
        onBids(msg);
      });
    });
    return Promise.all(promises);
  }

  subscribeForStatusUpdates(auction: Auction, userId: string, onUpdates: (bid: StreamMessage) => void) {
    return this._liveDataService.subscribeToStream(streamName, userId, (msg) => {
      if (msg.fromUser !== userId) { // don't update user on their own bids
        onUpdates(msg);
      }
    });
  }

  finishAuction(auction: Auction) {
    const copy = cloneObject(auction);
    copy.end = new Date().toISOString();
    const updatePromise = this._auctions.update(copy);
    // const streamPromises = this.unsubscribeFromParticipantStreams(auction);
    // return Promise.all(streamPromises.concat(updatePromise));
    return updatePromise;
  }

  unsubscribeFromParticipantStreams(auction: Auction) {
    return auction.participants.map(participantId => {
      return this._liveDataService.unsubscribeFromStream(streamName, participantId);
    });
  }

  // cant handle multiple auctions
  registerForAuction(auction: Auction, userId: string) {
    const auctionOwnerId = (auction._acl as any).creator;

    return this._liveDataService.setStreamACL(streamName, userId, {
      publish: [userId, auctionOwnerId],
      subscribe: [userId, auctionOwnerId]
    })
      .then(() => {
        const copy = cloneObject(auction);
        copy.participants = copy.participants || [];
        copy.participants.push(userId);
        return this._auctions.update(copy);
      });
  }

  // cant handle multiple auctions
  unregisterFromAuction(auction: Auction, userId: string) {
    return this._liveDataService.setStreamACL(streamName, userId, {
      publish: [userId],
      subscribe: []
    })
      .then(() => {
        const copy = cloneObject(auction);
        if (!copy.participants) {
          return Promise.resolve(auction);
        }
        copy.participants = copy.participants.filter(p => p !== userId);
        return this._auctions.update(copy);
      });
  }

  userIsRegistered(userId: string, auction: Auction) {
    return auction.participants && auction.participants.indexOf(userId) >= 0;
  }

  // getParticipants(auction: Auction) {
  //   const query = this._kinveyService.getNewQuery()
  //     .contains('_id', auction.participants);
  //   return this._usersService.getWithQuery(query);
  // }

  bidOnAuction(auction: Auction, bidderId: string, bid: number) {
    // const streamId: string = (auction._acl as any).creator;
    const message: BidMessage = {
      type: StreamMessageType.Bid,
      fromUser: bidderId,
      bid: bid
    };
    return this._liveDataService.publishToStream(streamName, bidderId, message);
  }
  
  acceptBidOnAuction(auction: Auction, bidderId: string, bid: number, newAskPrice: number) {
    const copy = cloneObject(auction);
    copy.currentBid = bid;
    copy.ask = newAskPrice;
    return this._auctions.update(copy);
  }

  validateAuctionData(auction: any) {
    let errorMsg: string = null;

    if (!auction) {
      errorMsg = 'Invalid auction';
    }

    if (!isNonemptyString(auction.item)) {
      errorMsg = 'Invalid auction item';
    }

    if (typeof auction.currentBid !== 'number' || auction.currentBid < 0) {
      errorMsg = 'Invalid starting bid';
    }

    return errorMsg;
  }
}
