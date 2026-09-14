import { LedgerRepository } from '../repository/interface.js';
import { Ledger, Group, Transaction, Participant, serializeLedger, deserializeLedger } from '@ledgerly/core';

function parseJsonWithBigInt<T>(jsonText: string): T {
  return JSON.parse(jsonText, (_key, value) => {
    if (value && typeof value === 'object' && value.__type === 'BigInt') {
      return BigInt(value.value);
    }
    return value;
  });
}

function stringifyWithBigInt(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'bigint') {
      return { __type: 'BigInt', value: value.toString() };
    }
    return value;
  });
}

export class ServerHttpRepository implements LedgerRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getLedger(id: string): Promise<Ledger | null> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.text();
    return deserializeLedger(json);
  }

  async saveLedger(ledger: Ledger): Promise<void> {
    const serialized = serializeLedger(ledger);
    const res = await fetch(`${this.baseUrl}/api/ledgers/${ledger.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  }

  async deleteLedger(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  }

  async getGroups(ledgerId: string): Promise<Group[]> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${ledgerId}/groups`);
    if (res.ok) {
      const json = await res.text();
      return parseJsonWithBigInt<Group[]>(json);
    }
    const l = await this.getLedger(ledgerId);
    return l ? l.groups : [];
  }

  async saveGroup(ledgerId: string, group: Group): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${ledgerId}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stringifyWithBigInt(group),
    });
    if (!res.ok) {
      const l = (await this.getLedger(ledgerId)) || {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const idx = l.groups.findIndex((g) => g.id === group.id);
      if (idx >= 0) l.groups[idx] = group;
      else l.groups.push(group);
      await this.saveLedger(l);
    }
  }

  async getTransactions(ledgerId: string, groupId?: string): Promise<Transaction[]> {
    const url = groupId
      ? `${this.baseUrl}/api/ledgers/${ledgerId}/transactions?groupId=${encodeURIComponent(groupId)}`
      : `${this.baseUrl}/api/ledgers/${ledgerId}/transactions`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.text();
      return parseJsonWithBigInt<Transaction[]>(json);
    }
    const l = await this.getLedger(ledgerId);
    if (!l) return [];
    if (groupId) return l.transactions.filter((t) => t.groupId === groupId);
    return l.transactions;
  }

  async saveTransaction(ledgerId: string, transaction: Transaction): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${ledgerId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stringifyWithBigInt(transaction),
    });
    if (!res.ok) {
      const l = (await this.getLedger(ledgerId)) || {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const idx = l.transactions.findIndex((t) => t.id === transaction.id);
      if (idx >= 0) l.transactions[idx] = transaction;
      else l.transactions.push(transaction);
      await this.saveLedger(l);
    }
  }

  async getParticipants(ledgerId: string): Promise<Participant[]> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${ledgerId}/participants`);
    if (res.ok) {
      const json = await res.text();
      return parseJsonWithBigInt<Participant[]>(json);
    }
    const l = await this.getLedger(ledgerId);
    return l ? l.participants : [];
  }

  async saveParticipant(ledgerId: string, participant: Participant): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${ledgerId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stringifyWithBigInt(participant),
    });
    if (!res.ok) {
      const l = (await this.getLedger(ledgerId)) || {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const idx = l.participants.findIndex((p) => p.id === participant.id);
      if (idx >= 0) l.participants[idx] = participant;
      else l.participants.push(participant);
      await this.saveLedger(l);
    }
  }

  async exportLedger(id: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/${id}/export`);
    if (res.ok) return res.text();
    const l = await this.getLedger(id);
    if (!l) throw new Error(`Ledger ${id} not found`);
    return serializeLedger(l);
  }

  async importLedger(jsonString: string): Promise<Ledger> {
    const res = await fetch(`${this.baseUrl}/api/ledgers/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonString,
    });
    if (!res.ok) {
      const l = deserializeLedger(jsonString);
      await this.saveLedger(l);
      return l;
    }
    const text = await res.text();
    return deserializeLedger(text);
  }
}
