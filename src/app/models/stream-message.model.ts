export enum StreamMessageType {
  Bid
}

export interface StreamMessage {
  type: StreamMessageType;
  fromUser: string;
}

export interface BidMessage extends StreamMessage {
  bid: number;
}
