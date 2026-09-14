import { LedgerRepository, InMemoryRepository } from '@ledgerly/storage';
import { Ledger } from '@ledgerly/core';

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
}
