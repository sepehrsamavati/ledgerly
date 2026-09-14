import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { getConfig } from '../infrastructure/config.js';
import { LedgerService } from '../services/ledger.service.js';
import { LedgerController } from '../controllers/ledger.controller.js';
import { ledgerRoutes } from '../routes/ledger.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const config = getConfig();
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: config.corsOrigin,
  });

  const ledgerService = new LedgerService();
  const ledgerController = new LedgerController(ledgerService);

  await fastify.register(ledgerRoutes, {
    prefix: config.prefix,
    controller: ledgerController,
  });

  return fastify;
}
