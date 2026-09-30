import { createServer } from 'node:http';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { createApp } from './app.js';
import { attachSocketServer } from './socket/index.js';

const app = createApp();
const httpServer = createServer(app);
attachSocketServer(httpServer);

async function start() {
  await prisma.$connect();
  httpServer.listen(env.PORT, () => console.log(`Fika API listening on http://localhost:${env.PORT}`));
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}; closing Fika API.`);
  httpServer.close(async () => { await prisma.$disconnect(); process.exit(0); });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
void start();
