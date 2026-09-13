import { LedgerRepository } from '../repository/interface.js';
import { Ledger, Group, Transaction, Participant, serializeLedger, deserializeLedger } from '@ledgerly/core';

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
    const l = await this.getLedger(ledgerId);
    return l ? l.groups : [];
  }

  async saveGroup(ledgerId: string, group: Group): Promise<void> {
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

  async getTransactions(ledgerId: string, groupId?: string): Promise<Transaction[]> {
    const l = await this.getLedger(ledgerId);
    if (!l) return [];
    if (groupId) return l.transactions.filter((t) => t.groupId === groupId);
    return l.transactions;
  }

  async saveTransaction(ledgerId: string, transaction: Transaction): Promise<void> {
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

  async getParticipants(ledgerId: string): Promise<Participant[]> {
    const l = await this.getLedger(ledgerId);
    return l ? l.participants : [];
  }

  async saveParticipant(ledgerId: string, participant: Participant): Promise<void> {
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

  async exportLedger(id: string): Promise<string> {
    const l = await this.getLedger(id);
    if (!l) throw new Error(`Ledger ${id} not found`);
    return serializeLedger(l);
  }

  async importLedger(jsonString: string): Promise<Ledger> {
    const l = deserializeLedger(jsonString);
    await this.saveLedger(l);
    return l;
  }
}
