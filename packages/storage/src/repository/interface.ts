import { Ledger, Group, Transaction, Participant } from '@ledgerly/core';

export interface LedgerRepository {
  getLedger(id: string): Promise<Ledger | null>;
  saveLedger(ledger: Ledger): Promise<void>;
  deleteLedger(id: string): Promise<void>;

  getGroups(ledgerId: string): Promise<Group[]>;
  saveGroup(ledgerId: string, group: Group): Promise<void>;

  getTransactions(ledgerId: string, groupId?: string): Promise<Transaction[]>;
  saveTransaction(ledgerId: string, transaction: Transaction): Promise<void>;

  getParticipants(ledgerId: string): Promise<Participant[]>;
  saveParticipant(ledgerId: string, participant: Participant): Promise<void>;

  exportLedger(id: string): Promise<string>;
  importLedger(jsonString: string): Promise<Ledger>;
}
