import { Status } from './transaction.interface';

export interface TransactionHistory {
  transactionId: string;
  previousStatus: Status | null;
  receivedStatus: Status;
  newStatus: Status;
  timestamp: string;
}
