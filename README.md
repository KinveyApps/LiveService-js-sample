# Kinvey Live Service Angular SDK Sample

A sample app to show the Kinvey Live Service API in the JavaScript SDKs. It simulates online auctioning of items. It features both features of the Live Service: collection subscription and user-to-user communication.

### Getting Started
To compile the app and start a server with live reload enabled, use the following:

```
npm install // or yarn install
npm start
```

After it starts, open `localhost:3000` in a browser.

### Functionality

The app's homescreen is a "live list" of all auctions. Participant count and auction states are updated in real time, with the collection subscription feature of Live Service. Auction details view is also updated in real time.

User can only register for one auction at a time. When an auction starts, the auction organizer subscribes for all participants' streams and listens for their bids. They also publish auction state updates to participants' streams. Each participant subscribes to their own stream and listens for these auction state updates and reacts to them.

When the auction organizer finishes the auction, a message is sent to all participants on their streams.

### If you wish to use your own backend environment for this app

You would need:

- to have Live Service enabled
- a collection named "Auctions" with permissions set to "Public"
- to substitute the currently used appKey and appSecret when initializing the Kinvey SDK in `kinvey.service.ts`

### Live Service in Angular2 documentation

[https://devcenter.kinvey.com/angular2/guides/live-service](https://devcenter.kinvey.com/angular2/guides/live-service)
