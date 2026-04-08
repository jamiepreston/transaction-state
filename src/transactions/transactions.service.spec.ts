import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transactions.service';
import { Transaction } from './interfaces/transaction.interface';
import { NotFoundException } from '@nestjs/common';

const mockTransaction = {
  TransactionId:
    '0xc817643232e94aec05b910aaa536dc5718299a089d6ec517a2706715b8f148a8',
  FromAddress: '0xEf6aE5F5108d210CB45fc8d50c07689374B3b2b2',
  ToAddress: '0xaB51d4a8DA4d981dfca0Bf64aEE96054B0D7C23e',
  TokenName: 'USDC',
  Amount: 1000.11,
  Status: 'Initiated',
} as Transaction;

describe('transactionsController', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  describe('create', () => {
    it('should add a transaction and a history entry', () => {
      service.create(mockTransaction);
      const result = service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTransaction);
    });
  });

  describe('update', () => {
    it('should update a given transaction', () => {
      service.create(mockTransaction);

      const updated = { ...mockTransaction, Amount: 2000 };

      service.update(updated, 0);

      const result = service.findAll();
      expect(result[0].Amount).toBe(2000);
    });
  });

  describe('put', () => {
    describe('given a transaction with that id already exists', () => {
      it('should update a transaction and always track history', () => {
        service.create(mockTransaction);

        const updated = {
          ...mockTransaction,
          Status: 'Processing',
        } as Transaction;

        service.put(updated);

        const { transaction, history } = service.findOne(
          mockTransaction.TransactionId,
        );

        expect(transaction.Status).toBe('Processing');
        expect(history).toHaveLength(2);

        expect(history[0]).toMatchObject({
          transactionId: mockTransaction.TransactionId,
          previousStatus: null,
          newStatus: 'Initiated',
        });
        expect(history[1]).toMatchObject({
          transactionId: mockTransaction.TransactionId,
          previousStatus: 'Initiated',
          newStatus: 'Processing',
        });
        expect(typeof history[0].timestamp).toBe('string');
      });
    });

    describe('given a transaction with that id does not exist', () => {
      it('should create a transaction with no history', () => {
        service.put(mockTransaction);

        const { transaction, history } = service.findOne(
          mockTransaction.TransactionId,
        );

        expect(transaction).toEqual(mockTransaction);
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
          transactionId: mockTransaction.TransactionId,
          previousStatus: null,
          newStatus: 'Initiated',
        });
      });
    });
  });

  describe('findAll', () => {
    it('should return all transactions', () => {
      service.create(mockTransaction);

      const result = service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    describe('given a transaction with that id already exists', () => {
      it('should return the transaction with history', () => {
        service.create(mockTransaction);

        service.put({ ...mockTransaction, Status: 'Processing' });

        const result = service.findOne(mockTransaction.TransactionId);

        expect(result.transaction).toBeDefined();
        expect(result.history).toHaveLength(2);
      });
    });

    describe('given a transaction with that id does not exist', () => {
      it('should throw a not found error', () => {
        expect(() => service.findOne('non-existent-id')).toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('updateStatus', () => {
    describe('given a status which is higher than the current', () => {
      it('should update the status and record history', () => {
        service.create(mockTransaction);

        service.put({ ...mockTransaction, Status: 'Complete' });

        const { transaction, history } = service.findOne(
          mockTransaction.TransactionId,
        );

        expect(transaction.Status).toBe('Complete');
        expect(history).toHaveLength(2);

        expect(history[1]).toMatchObject({
          previousStatus: 'Initiated',
          newStatus: 'Complete',
        });
      });
    });

    describe('given a status which is lower than the current', () => {
      it('should NOT downgrade status but still record history', () => {
        const existing = {
          ...mockTransaction,
          Status: 'Processing',
        } as Transaction;

        service.create(existing);

        service.put({ ...mockTransaction, Status: 'InMemPool' });

        const { transaction, history } = service.findOne(
          existing.TransactionId,
        );

        expect(transaction.Status).toBe('Processing');
        expect(history).toHaveLength(2);

        expect(history[1]).toMatchObject({
          previousStatus: 'Processing',
          receivedStatus: 'InMemPool',
          newStatus: 'Processing',
        });
      });
    });
  });

  describe('history tracking edge cases', () => {
    it('should record history even when status does not change', () => {
      service.create(mockTransaction);

      service.put({ ...mockTransaction, Status: 'Initiated' });

      const { history } = service.findOne(mockTransaction.TransactionId);

      expect(history).toHaveLength(2);

      expect(history[1]).toMatchObject({
        previousStatus: 'Initiated',
        newStatus: 'Initiated',
      });
    });

    it('should track multiple updates in order', () => {
      service.create(mockTransaction);

      service.put({ ...mockTransaction, Status: 'Processing' });
      service.put({ ...mockTransaction, Status: 'Complete' });

      const { history } = service.findOne(mockTransaction.TransactionId);

      expect(history).toHaveLength(3);

      expect(history[1]).toMatchObject({
        previousStatus: 'Initiated',
        newStatus: 'Processing',
      });

      expect(history[2]).toMatchObject({
        previousStatus: 'Processing',
        newStatus: 'Complete',
      });
    });
  });
});
