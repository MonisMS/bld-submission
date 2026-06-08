import { WebSocketServer, WebSocket } from 'ws';
import { type Server, type IncomingMessage } from 'http';
import { type Duplex } from 'stream';
import * as store from '../sessions/store.js';
import * as manager from '../docker/manager.js';
import config from '../config.js';

const pendingTeardowns = new Map<string, NodeJS.Timeout>();

export function attach(httpServer: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? '', 'http://localhost');

    if (url.pathname !== '/ws') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    const sessionId = url.searchParams.get('session') ?? '';
    if (!store.get(sessionId)) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const pending = pendingTeardowns.get(sessionId);
    if (pending) {
      clearTimeout(pending);
      pendingTeardowns.delete(sessionId);
      console.log(`reconnect cancelled teardown: ${sessionId}`);
    }

    wss.handleUpgrade(req, socket, head, (client) => {
      handleClient(sessionId, client).catch((err) => {
        console.error(`proxy error for ${sessionId}:`, err);
      });
    });
  });
}

async function handleClient(sessionId: string, client: WebSocket): Promise<void> {
  let agent: WebSocket;

  try {
    agent = await connectToAgent(sessionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'error', message }));
      client.close();
    }
    scheduleTeardown(sessionId);
    return;
  }

  agent.on('message', (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, { binary: isBinary });
    }
  });

  client.on('message', (data, isBinary) => {
    if (agent.readyState === WebSocket.OPEN) {
      agent.send(data, { binary: isBinary });
    }
  });

  agent.on('close', () => {
    if (client.readyState === WebSocket.OPEN) client.close();
  });

  agent.on('error', (err) => {
    console.error(`agent ws error [${sessionId}]:`, err.message);
  });

  client.on('close', () => {
    if (agent.readyState === WebSocket.OPEN) agent.close();
    scheduleTeardown(sessionId);
  });

  client.on('error', (err) => {
    console.error(`client ws error [${sessionId}]:`, err.message);
  });
}

async function connectToAgent(sessionId: string): Promise<WebSocket> {
  const url = `ws://rbc-browser-${sessionId}:${config.agentPort}`;
  const maxAttempts = 20;
  const delayMs = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await new Promise<WebSocket | null>((resolve) => {
      const ws = new WebSocket(url);
      ws.once('open', () => resolve(ws));
      ws.once('error', () => {
        ws.terminate();
        resolve(null);
      });
    });

    if (result) {
      console.log(`agent connected: ${sessionId} (attempt ${attempt + 1})`);
      return result;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw new Error(`agent ${sessionId} did not become available after ${maxAttempts} attempts`);
}

function scheduleTeardown(sessionId: string): void {
  const existing = pendingTeardowns.get(sessionId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    pendingTeardowns.delete(sessionId);
    store.remove(sessionId);
    await manager.destroy(sessionId).catch(() => {});
    console.log(`session torn down: ${sessionId}`);
  }, config.teardownGraceMs);

  pendingTeardowns.set(sessionId, timer);
}
