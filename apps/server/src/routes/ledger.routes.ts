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

  fastify.get('/api/ledgers/:id/groups', (req, reply) => controller.getGroups(req as any, reply));
  fastify.post('/api/ledgers/:id/groups', (req, reply) => controller.saveGroup(req as any, reply));

  fastify.get('/api/ledgers/:id/transactions', (req, reply) => controller.getTransactions(req as any, reply));
  fastify.post('/api/ledgers/:id/transactions', (req, reply) => controller.saveTransaction(req as any, reply));

  fastify.get('/api/ledgers/:id/participants', (req, reply) => controller.getParticipants(req as any, reply));
  fastify.post('/api/ledgers/:id/participants', (req, reply) => controller.saveParticipant(req as any, reply));

  fastify.get('/api/ledgers/:id/balances', (req, reply) => controller.getBalances(req as any, reply));
  fastify.get('/api/ledgers/:id/settlement', (req, reply) => controller.getSettlement(req as any, reply));

  fastify.get('/api/ledgers/:id/export', (req, reply) => controller.exportLedger(req as any, reply));
  fastify.post('/api/ledgers/import', (req, reply) => controller.importLedger(req as any, reply));
}
