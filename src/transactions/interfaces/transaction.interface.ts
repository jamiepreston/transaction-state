export type Status =
  | 'Initiated'
  | 'InMemPool'
  | 'Processing'
  | 'InCompliance'
  | 'Complete';

export interface Transaction {
  TransactionId: string;
  FromAddress: string;
  ToAddress: string;
  TokenName: string;
  Amount: number;
  Status: Status;
}
