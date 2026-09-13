import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRepository } from '../src/local/in-memory.js';
import { Ledger, Group, Transaction } from '@ledgerly/core';

describe('@ledgerly/storage', () => {
  let repo: InMemoryRepository;

  beforeEach(() => {
    repo = new InMemoryRepository();
  });

  it('saves and retrieves ledgers cleanly preserving BigInt amounts', async () => {
    const ledger: Ledger = {
      id: 'l1',
      title: 'Main Ledger',
      groups: [],
      participants: [{ id: 'p1', name: 'Alice' }],
      transactions: [],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };

    await repo.saveLedger(ledger);
    const fetched = await repo.getLedger('l1');
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Main Ledger');

    const group: Group = {
      id: 'g1',
      name: 'Trip Group',
      defaultCurrencyCode: 'USD',
      participantIds: ['p1'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    await repo.saveGroup('l1', group);

    const groups = await repo.getGroups('l1');
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Trip Group');

    const tx: Transaction = {
      id: 't1',
      groupId: 'g1',
      title: 'Lunch',
      type: 'expense',
      amount: 1500n,
      currencyCode: 'USD',
      payerId: 'p1',
      splits: [{ participantId: 'p1', amount: 1500n }],
      date: '2025-01-01',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    await repo.saveTransaction('l1', tx);

    const txs = await repo.getTransactions('l1', 'g1');
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(1500n);
  });
});
