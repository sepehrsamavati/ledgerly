import { FastifyRequest, FastifyReply } from 'fastify';
import { LedgerService } from '../services/ledger.service.js';
import { deserializeLedger, serializeLedger, Ledger } from '@ledgerly/core';

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
    const ledger: Ledger = typeof request.body === 'string' ? deserializeLedger(request.body) : (request.body as Ledger);

    ledger.id = id;
    await this.ledgerService.saveLedger(ledger);
    reply.type('application/json').send(serializeLedger(ledger));
  }

  async deleteLedger(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    await this.ledgerService.deleteLedger(id);
    reply.status(204).send();
  }
}
