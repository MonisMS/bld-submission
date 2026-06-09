import { WebSocketServer, type WebSocket } from 'ws';
import { type Frame } from 'puppeteer-core';
import { launch } from './browser.js';
import { start, stop } from './screencast.js';
import { dispatch, type InputMsg } from './input.js';
import config from './config.js';

export function createServer(): WebSocketServer {
  const wss = new WebSocketServer({ port: config.port });

  wss.on('connection', async (ws: WebSocket) => {
    let cleanup: (() => Promise<void>) | null = null;

    const sendControl = (msg: object) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    };

    try {
      const { browser, page } = await launch();

      cleanup = async () => {
        await stop();
        await browser.close().catch(() => {});
      };

      page.on('framenavigated', (frame: Frame) => {
        if (frame === page.mainFrame()) {
          sendControl({ type: 'url', value: frame.url() });
        }
      });

      page.on('load', async () => {
        try {
          const title = await page.title();
          sendControl({ type: 'title', value: title });
        } catch {}
      });

      sendControl({ type: 'ready', viewport: config.viewport });

      await start(page, (frame) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(frame);
        }
      });

      ws.on('message', async (data, isBinary) => {
        if (isBinary) return;
        try {
          const msg = JSON.parse(data.toString()) as InputMsg;
          await dispatch(page, msg).catch((err: unknown) => {
            if (msg.type === 'navigate') {
              const message = err instanceof Error ? err.message : String(err);
              sendControl({ type: 'error', message });
            }
          });
        } catch {
          // ignore malformed messages
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendControl({ type: 'error', message });
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
