export enum StreamMessageType {
  Bid,
  AuctionEnd,
  Error
}

export interface StreamMessage {
  type: StreamMessageType;
  fromUser: string;
}

export interface BidMessage extends StreamMessage {
  bid: number;
}

export interface AuctionEndMessage extends StreamMessage {
  winner: string | string[];
}

export interface ErrorMessage extends StreamMessage {
  error: string;
}
