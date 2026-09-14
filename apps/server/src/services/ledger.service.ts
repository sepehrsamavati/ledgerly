import { LedgerRepository, InMemoryRepository } from '@ledgerly/storage';
import {
  Ledger,
  Group,
  Transaction,
  Participant,
  calculateParticipantBalances,
  calculateSettlement as calculateSettlementDebts,
  Debt,
} from '@ledgerly/core';

export class LedgerService {
  private repository: LedgerRepository;

  constructor(repository?: LedgerRepository) {
    this.repository = repository || new InMemoryRepository();
  }

  async getLedger(id: string): Promise<Ledger | null> {
    return this.repository.getLedger(id);
  }

  async saveLedger(ledger: Ledger): Promise<void> {
    await this.repository.saveLedger(ledger);
  }

  async deleteLedger(id: string): Promise<void> {
    await this.repository.deleteLedger(id);
  }

  async getGroups(ledgerId: string): Promise<Group[]> {
    return this.repository.getGroups(ledgerId);
  }

  async saveGroup(ledgerId: string, group: Group): Promise<void> {
    await this.repository.saveGroup(ledgerId, group);
  }

  async getTransactions(ledgerId: string, groupId?: string): Promise<Transaction[]> {
    return this.repository.getTransactions(ledgerId, groupId);
  }

  async saveTransaction(ledgerId: string, transaction: Transaction): Promise<void> {
    await this.repository.saveTransaction(ledgerId, transaction);
  }

  async getParticipants(ledgerId: string): Promise<Participant[]> {
    return this.repository.getParticipants(ledgerId);
  }

  async saveParticipant(ledgerId: string, participant: Participant): Promise<void> {
    await this.repository.saveParticipant(ledgerId, participant);
  }

  async calculateBalances(ledgerId: string, groupId?: string): Promise<Record<string, bigint>> {
    const transactions = await this.repository.getTransactions(ledgerId, groupId);
    return calculateParticipantBalances(transactions);
  }

  async calculateSettlement(ledgerId: string, groupId?: string): Promise<Debt[]> {
    const balances = await this.calculateBalances(ledgerId, groupId);
    return calculateSettlementDebts(balances);
  }

  async exportLedger(id: string): Promise<string> {
    return this.repository.exportLedger(id);
  }

  async importLedger(jsonString: string): Promise<Ledger> {
    return this.repository.importLedger(jsonString);
  }
}
