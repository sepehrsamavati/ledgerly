import { FastifyRequest, FastifyReply } from 'fastify';
import { LedgerService } from '../services/ledger.service.js';
import {
  deserializeLedger,
  serializeLedger,
  Ledger,
  Group,
  Transaction,
  Participant,
  Currency,
  ExchangeRate,
  validateGroup,
  validateTransaction,
  validateParticipant,
} from '@ledgerly/core';

function stringifyWithBigInt(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'bigint') {
      return { __type: 'BigInt', value: value.toString() };
    }
    return value;
  });
}

function parseWithBigInt<T>(body: unknown): T {
  if (typeof body === 'string') {
    return deserializeLedger(body) as unknown as T;
  }
  const jsonStr = JSON.stringify(body);
  return deserializeLedger(jsonStr) as unknown as T;
}

export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  async getLedger(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const ledger = await this.ledgerService.getLedger(id);
    if (!ledger) {
      return reply.status(404).send({ error: 'Ledger not found' });
    }
    reply.type('application/json').send(serializeLedger(ledger));
  }

  async saveLedger(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
    const { id } = request.params;
    const ledger = parseWithBigInt<Ledger>(request.body);
    ledger.id = id;

    await this.ledgerService.saveLedger(ledger);
    reply.type('application/json').send(serializeLedger(ledger));
  }

  async deleteLedger(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    await this.ledgerService.deleteLedger(id);
    reply.status(204).send();
  }

  async getGroups(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const groups = await this.ledgerService.getGroups(id);
    reply.type('application/json').send(stringifyWithBigInt(groups));
  }

  async saveGroup(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
    const { id } = request.params;
    const group = parseWithBigInt<Group>(request.body);

    const errors = validateGroup(group);
    if (errors.length > 0) {
      return reply.status(400).send({ error: 'Validation failed', details: errors });
    }

    await this.ledgerService.saveGroup(id, group);
    reply.type('application/json').send(stringifyWithBigInt(group));
  }

  async getTransactions(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { groupId?: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { groupId } = request.query;
    const transactions = await this.ledgerService.getTransactions(id, groupId);
    reply.type('application/json').send(stringifyWithBigInt(transactions));
  }

  async saveTransaction(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
    const { id } = request.params;
    const transaction = parseWithBigInt<Transaction>(request.body);

    const errors = validateTransaction(transaction);
    if (errors.length > 0) {
      return reply.status(400).send({ error: 'Validation failed', details: errors });
    }

    await this.ledgerService.saveTransaction(id, transaction);
    reply.type('application/json').send(stringifyWithBigInt(transaction));
  }

  async getParticipants(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const participants = await this.ledgerService.getParticipants(id);
    reply.type('application/json').send(stringifyWithBigInt(participants));
  }

  async saveParticipant(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
    const { id } = request.params;
    const participant = parseWithBigInt<Participant>(request.body);

    const errors = validateParticipant(participant);
    if (errors.length > 0) {
      return reply.status(400).send({ error: 'Validation failed', details: errors });
    }

    await this.ledgerService.saveParticipant(id, participant);
    reply.type('application/json').send(stringifyWithBigInt(participant));
  }

  async getExchangeRates(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const rates = await this.ledgerService.getExchangeRates(id);
    reply.type('application/json').send(stringifyWithBigInt(rates));
  }

  async saveExchangeRate(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
    const { id } = request.params;
    const rate = parseWithBigInt<ExchangeRate>(request.body);
    await this.ledgerService.saveExchangeRate(id, rate);
    reply.type('application/json').send(stringifyWithBigInt(rate));
  }

  async getCurrencies(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const currencies = await this.ledgerService.getCurrencies(id);
    reply.type('application/json').send(stringifyWithBigInt(currencies));
  }

  async saveCurrency(request: FastifyRequest<{ Params: { id: string }; Body: unknown }>, reply: FastifyReply) {
    const { id } = request.params;
    const currency = parseWithBigInt<Currency>(request.body);
    await this.ledgerService.saveCurrency(id, currency);
    reply.type('application/json').send(stringifyWithBigInt(currency));
  }

  async getBalances(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { groupId?: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { groupId } = request.query;
    const balances = await this.ledgerService.calculateBalances(id, groupId);
    reply.type('application/json').send(stringifyWithBigInt(balances));
  }

  async getSettlement(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { groupId?: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { groupId } = request.query;
    const settlement = await this.ledgerService.calculateSettlement(id, groupId);
    reply.type('application/json').send(stringifyWithBigInt(settlement));
  }

  async exportLedger(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    try {
      const exported = await this.ledgerService.exportLedger(id);
      reply.type('application/json').send(exported);
    } catch (err: any) {
      reply.status(404).send({ error: err.message || 'Ledger not found' });
    }
  }

  async importLedger(request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
    const jsonString = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    try {
      const ledger = await this.ledgerService.importLedger(jsonString);
      reply.type('application/json').send(serializeLedger(ledger));
    } catch (err: any) {
      reply.status(400).send({ error: 'Failed to import ledger', details: err.message });
    }
  }
}
