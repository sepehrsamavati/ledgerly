import { FastifyInstance } from 'fastify';
import { LedgerController } from '../controllers/ledger.controller.js';

export async function ledgerRoutes(fastify: FastifyInstance, options: { controller: LedgerController }) {
  const { controller } = options;

  fastify.get('/health', async () => {
    return { status: 'ok', service: 'ledgerly-server', timestamp: new Date().toISOString() };
  });

  fastify.get('/api/ledgers/:id', (req, reply) => controller.getLedger(req as any, reply));
  fastify.put('/api/ledgers/:id', (req, reply) => controller.saveLedger(req as any, reply));
  fastify.delete('/api/ledgers/:id', (req, reply) => controller.deleteLedger(req as any, reply));
}
