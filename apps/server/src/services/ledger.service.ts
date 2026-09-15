import { LedgerRepository, InMemoryRepository } from '@ledgerly/storage';
import {
  Ledger,
  Group,
  Transaction,
  Participant,
  Currency,
  ExchangeRate,
  calculateParticipantBalancesWithRates,
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

  async getExchangeRates(ledgerId: string): Promise<ExchangeRate[]> {
    return this.repository.getExchangeRates(ledgerId);
  }

  async saveExchangeRate(ledgerId: string, rate: ExchangeRate): Promise<void> {
    await this.repository.saveExchangeRate(ledgerId, rate);
  }

  async getCurrencies(ledgerId: string): Promise<Currency[]> {
    return this.repository.getCurrencies(ledgerId);
  }

  async saveCurrency(ledgerId: string, currency: Currency): Promise<void> {
    await this.repository.saveCurrency(ledgerId, currency);
  }

  async calculateBalances(ledgerId: string, groupId?: string): Promise<Record<string, bigint>> {
    const transactions = await this.repository.getTransactions(ledgerId, groupId);
    const ledger = await this.repository.getLedger(ledgerId);
    let targetCurrencyCode = 'USD';
    if (groupId) {
      const groups = await this.repository.getGroups(ledgerId);
      const group = groups.find((g) => g.id === groupId);
      if (group?.defaultCurrencyCode) targetCurrencyCode = group.defaultCurrencyCode;
    } else if (ledger?.baseCurrencyCode) {
      targetCurrencyCode = ledger.baseCurrencyCode;
    }

    const rates = ledger?.exchangeRates || [];
    return calculateParticipantBalancesWithRates(transactions, targetCurrencyCode, rates);
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
