import { WebSocketServer, type WebSocket } from 'ws';
import { launch } from './browser.js';
import { start, stop } from './screencast.js';
import config from './config.js';

export function createServer(): WebSocketServer {
  const wss = new WebSocketServer({ port: config.port });

  wss.on('connection', async (ws: WebSocket) => {
    let cleanup: (() => Promise<void>) | null = null;

    try {
      const { browser, page } = await launch();

      cleanup = async () => {
        await stop();
        await browser.close().catch(() => {});
      };

      ws.send(JSON.stringify({ type: 'ready', viewport: config.viewport }));

      await start(page, (frame) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(frame);
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      ws.send(JSON.stringify({ type: 'error', message }));
      ws.close();
    }

    ws.on('close', async () => {
      if (cleanup) await cleanup();
    });

    ws.on('error', async () => {
      if (cleanup) await cleanup();
    });
  });

  return wss;
}
