import { LedgerRepository } from '../repository/interface.js';
import { Ledger, Group, Transaction, Participant, serializeLedger, deserializeLedger } from '@ledgerly/core';

export class InMemoryRepository implements LedgerRepository {
  private ledgers: Map<string, Ledger> = new Map();

  async getLedger(id: string): Promise<Ledger | null> {
    const l = this.ledgers.get(id);
    return l ? deserializeLedger(serializeLedger(l)) : null;
  }

  async saveLedger(ledger: Ledger): Promise<void> {
    this.ledgers.set(ledger.id, deserializeLedger(serializeLedger(ledger)));
  }

  async deleteLedger(id: string): Promise<void> {
    this.ledgers.delete(id);
  }

  async getGroups(ledgerId: string): Promise<Group[]> {
    const l = await this.getLedger(ledgerId);
    return l ? l.groups : [];
  }

  async saveGroup(ledgerId: string, group: Group): Promise<void> {
    let l = await this.getLedger(ledgerId);
    if (!l) {
      l = {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const idx = l.groups.findIndex((g) => g.id === group.id);
    if (idx >= 0) {
      l.groups[idx] = group;
    } else {
      l.groups.push(group);
    }
    await this.saveLedger(l);
  }

  async getTransactions(ledgerId: string, groupId?: string): Promise<Transaction[]> {
    const l = await this.getLedger(ledgerId);
    if (!l) return [];
    if (groupId) {
      return l.transactions.filter((t) => t.groupId === groupId);
    }
    return l.transactions;
  }

  async saveTransaction(ledgerId: string, transaction: Transaction): Promise<void> {
    let l = await this.getLedger(ledgerId);
    if (!l) {
      l = {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const idx = l.transactions.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) {
      l.transactions[idx] = transaction;
    } else {
      l.transactions.push(transaction);
    }
    await this.saveLedger(l);
  }

  async getParticipants(ledgerId: string): Promise<Participant[]> {
    const l = await this.getLedger(ledgerId);
    return l ? l.participants : [];
  }

  async saveParticipant(ledgerId: string, participant: Participant): Promise<void> {
    let l = await this.getLedger(ledgerId);
    if (!l) {
      l = {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const idx = l.participants.findIndex((p) => p.id === participant.id);
    if (idx >= 0) {
      l.participants[idx] = participant;
    } else {
      l.participants.push(participant);
    }
    await this.saveLedger(l);
  }

  async exportLedger(id: string): Promise<string> {
    const l = await this.getLedger(id);
    if (!l) throw new Error(`Ledger with id ${id} not found`);
    return serializeLedger(l);
  }

  async importLedger(jsonString: string): Promise<Ledger> {
    const l = deserializeLedger(jsonString);
    await this.saveLedger(l);
    return l;
  }
}
