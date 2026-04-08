import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from './interfaces/transaction.interface';
import { status } from './constants';
import { TransactionHistory } from './interfaces/transaction-history.interface';

@Injectable()
export class TransactionService {
  private transactions: Transaction[] = [];
  private history: TransactionHistory[] = [];

  create(transaction: Transaction) {
    const historyEntry: TransactionHistory = {
      transactionId: transaction.TransactionId,
      previousStatus: null,
      receivedStatus: transaction.Status,
      newStatus: transaction.Status,
      timestamp: new Date().toUTCString(),
    };
    this.history.push(historyEntry);
    this.transactions.push(transaction);
  }

  update(transaction: Transaction, index: number) {
    this.transactions[index] = transaction;
  }

  put(transaction: Transaction) {
    try {
      const { transaction: existingTransaction, index } = this.findOne(
        transaction.TransactionId,
      );
      const updatedTransaction = this.updateStatus(
        existingTransaction,
        transaction,
      );
      return this.update(updatedTransaction, index);
    } catch (e) {
      if (e instanceof NotFoundException) {
        return this.create(transaction);
      }
    }
  }

  findAll(): Transaction[] {
    return this.transactions;
  }

  findOne(id: string): {
    transaction: Transaction;
    index: number;
    history: TransactionHistory[];
  } {
    const index = this.transactions.findIndex((t) => t.TransactionId === id);

    if (index === -1) {
      throw new NotFoundException('Transaction not found');
    }

    const transaction = this.transactions[index];

    const history = this.history.filter((h) => h.transactionId === id);

    return { transaction, index, history };
  }

  updateStatus(existing: Transaction, updated: Transaction): Transaction {
    const existingStatusHeight = status.indexOf(existing.Status);
    const updatedStatusHeight = status.indexOf(updated.Status);

    const newStatus =
      existingStatusHeight > updatedStatusHeight
        ? existing.Status
        : updated.Status;

    const historyEntry: TransactionHistory = {
      transactionId: existing.TransactionId,
      previousStatus: existing.Status,
      receivedStatus: updated.Status,
      newStatus: newStatus,
      timestamp: new Date().toUTCString(),
    };
    this.history.push(historyEntry);

    return {
      ...existing,
      Status: newStatus,
    };
  }
}
