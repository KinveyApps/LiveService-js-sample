import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/map';

import { Kinvey } from 'kinvey-angular2-sdk';

import { KinveyService } from './kinvey.service';
import { UsersService } from './users.service';
import { LiveDataService } from './live-data.service';
import { Auction, BidMessage, StreamMessage, StreamMessageType } from '../models';
import { isNonemptyString, cloneObject, makeObservableZoneAware } from '../shared';

const collectionName = 'Auctions';
const streamName = collectionName;

@Injectable()
export class AuctionsService {
  private _auctions: Kinvey.CacheStore<Auction>;

  constructor(
    private _kinveyService: KinveyService,
    private _liveDataService: LiveDataService,
    private _usersService: UsersService,
    private _zone: NgZone
  ) {
    this._auctions = _kinveyService.getNewCollection<Auction>(collectionName);
  }

  getAll() {
    return this.getWithQuery();
  }

  getWithQuery(query?: Kinvey.Query) {
    const obs = this._auctions.find(query);
    return makeObservableZoneAware(this._zone, obs);
  }

  getById(id: string) {
    const obs = this._auctions.findById(id);
    return makeObservableZoneAware(this._zone, obs);
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

    const subObs = this.subscribeToAuctionCollection(interestedIn);
    return this.getWithQuery(query).merge(subObs);
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
        if (msg.fromUser && msg.fromUser !== (auction._acl as any).creator) { // creator's messages are not bids
          onBids(msg);
        }
      });
    });
    return Promise.all(promises);
  }

  unsubscribeFromBids(auction: Auction) {
    return this._unsubscribeFromParticipantStreams(auction);
  }

  subscribeForStatusUpdates(userId: string, onUpdates: (bid: StreamMessage) => void) {
    return this._liveDataService.subscribeToStream(streamName, userId, (msg) => {
      if (msg.fromUser && msg.fromUser !== userId) { // don't update user on their own bids
        onUpdates(msg);
      }
    });
  }

  unsubscribeFromStatusUpdates(userId: string) {
    return this._liveDataService.unsubscribeFromStream(streamName, userId);
  }

  finishAuction(auction: Auction) {
    const copy = cloneObject(auction);
    copy.end = new Date().toISOString();

    return this._auctions.update(copy);
  }

  // cant handle multiple auctions
  registerForAuction(auction: Auction, userId: string) {
    const auctionOwnerId = (auction._acl as any).creator;

    return this.isSubbedForAnyAuction(userId)
      .then((isRegistered) => {
        if (isRegistered) {
          const msg = 'You are already subbed for an auction.\nCurrently, you can only register for one auction at a time';
          return Promise.reject({ message: msg });
        }
        return this._liveDataService.setStreamACL(streamName, userId, {
          publish: [userId, auctionOwnerId],
          subscribe: [userId, auctionOwnerId]
        });
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

  sendMessageToParticipants(auction: Auction, message: StreamMessage) {
    if (!auction.participants) {
      return Promise.resolve<any>(null);
    }
    const promises = auction.participants.map((participantId) => {
      return this._liveDataService.publishToStream(streamName, participantId, message);
    });
    return Promise.all(promises);
  }

  acceptBidOnAuction(auction: Auction, bidderId: string, bid: number, newAskPrice: number) {
    const copy = cloneObject(auction);
    copy.currentBid = bid;
    copy.ask = newAskPrice;
    return this._auctions.update(copy);
  }

  isSubbedForAnyAuction(userId: string) {
    const query = this._kinveyService.getNewQuery()
      .equalTo('participants', userId);
    return this.getWithQuery(query).toPromise()
      .then((auctions) => auctions && auctions.length > 0);
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

  private _unsubscribeFromParticipantStreams(auction: Auction) {
    if (!auction.participants) {
      return Promise.resolve<any>(null);
    }
    const promises = auction.participants.map(participantId => {
      return this._liveDataService.unsubscribeFromStream(streamName, participantId);
    });
    return Promise.all(promises);
  }
}
