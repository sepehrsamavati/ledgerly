import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app/index.js';
import { FastifyInstance } from 'fastify';
import { serializeLedger, Ledger } from '@ledgerly/core';

describe('@ledgerly/server', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({ logger: false });
  });

  it('responds with 200 on /health', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('ledgerly-server');
  });

  it('handles ledger CRUD operations', async () => {
    const getInitial = await app.inject({
      method: 'GET',
      url: '/api/ledgers/test-1',
    });
    expect(getInitial.statusCode).toBe(404);

    const ledger: Ledger = {
      id: 'test-1',
      title: 'Vacation Ledger',
      groups: [],
      participants: [{ id: 'p1', name: 'Alice' }],
      transactions: [],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };

    const putRes = await app.inject({
      method: 'PUT',
      url: '/api/ledgers/test-1',
      headers: { 'Content-Type': 'application/json' },
      body: serializeLedger(ledger),
    });
    expect(putRes.statusCode).toBe(200);

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/ledgers/test-1',
    });
    expect(getRes.statusCode).toBe(200);
    const fetched = getRes.json();
    expect(fetched.title).toBe('Vacation Ledger');
    expect(fetched.participants).toHaveLength(1);

    const delRes = await app.inject({
      method: 'DELETE',
      url: '/api/ledgers/test-1',
    });
    expect(delRes.statusCode).toBe(204);

    const getAfterDel = await app.inject({
      method: 'GET',
      url: '/api/ledgers/test-1',
    });
    expect(getAfterDel.statusCode).toBe(404);
  });

  it('validates sub-resources using @ledgerly/core rules and returns 400', async () => {
    const invalidGroupRes = await app.inject({
      method: 'POST',
      url: '/api/ledgers/test-val/groups',
      headers: { 'Content-Type': 'application/json' },
      body: { id: 'g1', name: '', defaultCurrencyCode: 'USD' },
    });
    expect(invalidGroupRes.statusCode).toBe(400);
    const groupErr = invalidGroupRes.json();
    expect(groupErr.error).toBe('Validation failed');
    expect(groupErr.details[0].field).toBe('name');

    const invalidTxRes = await app.inject({
      method: 'POST',
      url: '/api/ledgers/test-val/transactions',
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'tx1',
        groupId: 'g1',
        title: 'Dinner',
        type: 'expense',
        amount: { __type: 'BigInt', value: '1000' },
        currencyCode: 'USD',
        payerId: 'p1',
        splits: [{ participantId: 'p1', amount: { __type: 'BigInt', value: '500' } }],
        date: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    });
    expect(invalidTxRes.statusCode).toBe(400);
    const txErr = invalidTxRes.json();
    expect(txErr.error).toBe('Validation failed');

    const invalidParticipantRes = await app.inject({
      method: 'POST',
      url: '/api/ledgers/test-val/participants',
      headers: { 'Content-Type': 'application/json' },
      body: { id: 'p1', name: '  ' },
    });
    expect(invalidParticipantRes.statusCode).toBe(400);
  });

  it('calculates participant balances and settlement debts on server side', async () => {
    const ledger: Ledger = {
      id: 'calc-1',
      title: 'Calculation Test Ledger',
      groups: [{ id: 'g1', name: 'Group 1', defaultCurrencyCode: 'USD', participantIds: ['p1', 'p2'], createdAt: '', updatedAt: '' }],
      participants: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
      transactions: [
        {
          id: 'tx1',
          groupId: 'g1',
          title: 'Dinner',
          type: 'expense',
          amount: 4000n,
          currencyCode: 'USD',
          payerId: 'p1',
          splits: [
            { participantId: 'p1', amount: 2000n },
            { participantId: 'p2', amount: 2000n },
          ],
          date: '2025-01-01',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };

    await app.inject({
      method: 'PUT',
      url: '/api/ledgers/calc-1',
      headers: { 'Content-Type': 'application/json' },
      body: serializeLedger(ledger),
    });

    const balancesRes = await app.inject({
      method: 'GET',
      url: '/api/ledgers/calc-1/balances',
    });
    expect(balancesRes.statusCode).toBe(200);
    const balances = balancesRes.json();
    expect(balances.p1.value).toBe('2000');
    expect(balances.p2.value).toBe('-2000');

    const settlementRes = await app.inject({
      method: 'GET',
      url: '/api/ledgers/calc-1/settlement',
    });
    expect(settlementRes.statusCode).toBe(200);
    const settlement = settlementRes.json();
    expect(settlement).toHaveLength(1);
    expect(settlement[0].from).toBe('p2');
    expect(settlement[0].to).toBe('p1');
    expect(settlement[0].amount.value).toBe('2000');
  });

  it('supports export and import endpoints', async () => {
    const ledger: Ledger = {
      id: 'exp-1',
      title: 'Export Ledger',
      groups: [],
      participants: [{ id: 'p1', name: 'Alice' }],
      transactions: [],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };

    await app.inject({
      method: 'PUT',
      url: '/api/ledgers/exp-1',
      headers: { 'Content-Type': 'application/json' },
      body: serializeLedger(ledger),
    });

    const exportRes = await app.inject({
      method: 'GET',
      url: '/api/ledgers/exp-1/export',
    });
    expect(exportRes.statusCode).toBe(200);
    const exportedJson = exportRes.payload;

    const importRes = await app.inject({
      method: 'POST',
      url: '/api/ledgers/import',
      headers: { 'Content-Type': 'application/json' },
      body: exportedJson,
    });
    expect(importRes.statusCode).toBe(200);
    const importedLedger = importRes.json();
    expect(importedLedger.id).toBe('exp-1');
  });
});
