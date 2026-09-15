import { LedgerRepository } from '../repository/interface.js';
import {
  Ledger,
  Group,
  Transaction,
  Participant,
  Currency,
  ExchangeRate,
  DEFAULT_CURRENCIES,
  serializeLedger,
  deserializeLedger,
} from '@ledgerly/core';

const DB_NAME = 'ledgerly_db';
const DB_VERSION = 1;
const STORE_NAME = 'ledgers';

export class IndexedDBRepository implements LedgerRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getLedger(id: string): Promise<Ledger | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (!request.result) return resolve(null);
        try {
          const ledger = deserializeLedger(request.result.data);
          resolve(ledger);
        } catch (e) {
          reject(e);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveLedger(ledger: Ledger): Promise<void> {
    const db = await this.getDB();
    const serialized = serializeLedger(ledger);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id: ledger.id, data: serialized, updatedAt: ledger.updatedAt });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteLedger(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
    if (idx >= 0) l.transactions[idx] = transaction;
    else l.transactions.push(transaction);
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
    if (idx >= 0) l.participants[idx] = participant;
    else l.participants.push(participant);
    await this.saveLedger(l);
  }

  async getExchangeRates(ledgerId: string): Promise<ExchangeRate[]> {
    const l = await this.getLedger(ledgerId);
    return l?.exchangeRates || [];
  }

  async saveExchangeRate(ledgerId: string, rate: ExchangeRate): Promise<void> {
    let l = await this.getLedger(ledgerId);
    if (!l) {
      l = {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        exchangeRates: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const rates = l.exchangeRates || [];
    const idx = rates.findIndex(
      (r) =>
        r.id === rate.id ||
        (r.fromCurrencyCode === rate.fromCurrencyCode && r.toCurrencyCode === rate.toCurrencyCode)
    );
    if (idx >= 0) rates[idx] = rate;
    else rates.push(rate);
    l.exchangeRates = rates;
    await this.saveLedger(l);
  }

  async getCurrencies(ledgerId: string): Promise<Currency[]> {
    const l = await this.getLedger(ledgerId);
    return l?.currencies && l.currencies.length > 0 ? l.currencies : DEFAULT_CURRENCIES;
  }

  async saveCurrency(ledgerId: string, currency: Currency): Promise<void> {
    let l = await this.getLedger(ledgerId);
    if (!l) {
      l = {
        id: ledgerId,
        title: 'Default Ledger',
        groups: [],
        participants: [],
        transactions: [],
        currencies: [...DEFAULT_CURRENCIES],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const currencies = l.currencies || [...DEFAULT_CURRENCIES];
    const idx = currencies.findIndex((c) => c.code === currency.code || c.id === currency.id);
    if (idx >= 0) currencies[idx] = currency;
    else currencies.push(currency);
    l.currencies = currencies;
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
