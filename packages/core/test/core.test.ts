import { describe, it, expect } from 'vitest';
import {
  createMoney,
  formatMoney,
  DEFAULT_CURRENCIES,
  calculateEqualSplits,
  calculateParticipantBalances,
  calculateSettlement,
  validateTransaction,
  serializeLedger,
  deserializeLedger,
  Ledger,
  Transaction,
} from '../src/index.js';

describe('@ledgerly/core', () => {
  const usd = DEFAULT_CURRENCIES.find((c) => c.code === 'USD')!;

  describe('Money & Currency', () => {
    it('creates money in minor units accurately without floating point loss', () => {
      const money = createMoney(10.25, usd);
      expect(money.amount).toBe(1025n);
      expect(money.currencyCode).toBe('USD');
    });

    it('formats money correctly', () => {
      const money = createMoney(10.25, usd);
      expect(formatMoney(money, usd)).toBe('$10.25');
    });
  });

  describe('Calculations', () => {
    it('splits amounts equally with remainder handling', () => {
      const total = 1000n; // $10.00 split among 3 people
      const splits = calculateEqualSplits(total, ['p1', 'p2', 'p3']);
      expect(splits).toHaveLength(3);
      expect(splits[0].amount).toBe(334n);
      expect(splits[1].amount).toBe(333n);
      expect(splits[2].amount).toBe(333n);
      expect(splits.reduce((acc, s) => acc + s.amount, 0n)).toBe(1000n);
    });

    it('calculates participant balances and settlement debts correctly', () => {
      const tx: Transaction = {
        id: 'tx1',
        groupId: 'g1',
        title: 'Dinner',
        type: 'expense',
        amount: 3000n, // $30.00
        currencyCode: 'USD',
        payerId: 'p1', // Alice paid
        splits: [
          { participantId: 'p1', amount: 1000n },
          { participantId: 'p2', amount: 1000n },
          { participantId: 'p3', amount: 1000n },
        ],
        date: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      const balances = calculateParticipantBalances([tx]);
      expect(balances['p1']).toBe(2000n); // Alice is owed $20
      expect(balances['p2']).toBe(-1000n); // Bob owes $10
      expect(balances['p3']).toBe(-1000n); // Charlie owes $10

      const debts = calculateSettlement(balances);
      expect(debts).toHaveLength(2);
      expect(debts).toContainEqual({ from: 'p2', to: 'p1', amount: 1000n });
      expect(debts).toContainEqual({ from: 'p3', to: 'p1', amount: 1000n });
    });
  });

  describe('Validation', () => {
    it('validates transaction total vs splits sum', () => {
      const invalidTx: Partial<Transaction> = {
        title: 'Lunch',
        amount: 2000n,
        payerId: 'p1',
        splits: [
          { participantId: 'p1', amount: 1000n },
          { participantId: 'p2', amount: 500n }, // Sum is 1500 != 2000
        ],
      };
      const errors = validateTransaction(invalidTx);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('splits');
    });
  });

  describe('Serialization', () => {
    it('serializes and deserializes BigInt fields properly', () => {
      const ledger: Ledger = {
        id: 'l1',
        title: 'Trip',
        groups: [],
        participants: [{ id: 'p1', name: 'Alice' }],
        transactions: [
          {
            id: 'tx1',
            groupId: 'g1',
            title: 'Coffee',
            type: 'expense',
            amount: 500n,
            currencyCode: 'USD',
            payerId: 'p1',
            splits: [{ participantId: 'p1', amount: 500n }],
            date: '2025-01-01',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      const json = serializeLedger(ledger);
      const restored = deserializeLedger(json);
      expect(restored.transactions[0].amount).toBe(500n);
      expect(restored.transactions[0].splits[0].amount).toBe(500n);
    });
  });
});
