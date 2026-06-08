import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import * as manager from './docker/manager.js';
import * as store from './sessions/store.js';
import sessionRoutes from './routes/sessions.js';
import { attach } from './ws/proxy.js';
import config from './config.js';

const app = express();

app.use(cors({ origin: config.webOrigin }));
app.use(express.json());
app.use('/api/sessions', sessionRoutes);

const server = createServer(app);

async function shutdown(): Promise<void> {
  console.log('shutting down, destroying all sessions');
  const sessions = store.list();
  await Promise.all(sessions.map((s) => manager.destroy(s.id).catch(() => {})));
  server.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function start(): Promise<void> {
  await manager.reap();
  await manager.ensureNetwork();
  attach(server);

  server.listen(config.serverPort, () => {
    console.log(`server listening on port ${config.serverPort}`);
  });
}

start().catch((err) => {
  console.error('startup failed:', err);
  process.exit(1);
});
