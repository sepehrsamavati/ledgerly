import { buildApp } from './app/index.js';
import { getConfig } from './infrastructure/config.js';

async function main() {
  const config = getConfig();
  const server = await buildApp();

  try {
    await server.listen({ port: config.port, host: config.host });
    console.log(`Ledgerly Fastify server running on http://${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
