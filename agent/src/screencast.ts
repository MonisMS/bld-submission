import { type Page, type CDPSession } from 'puppeteer-core';
import config from './config.js';

let session: CDPSession | null = null;

export async function start(page: Page, onFrame: (data: Buffer) => void): Promise<void> {
  session = await page.createCDPSession();

  // Every frame must be acked or Chrome stops sending after a few frames.
  session.on('Page.screencastFrame', async (event) => {
    onFrame(Buffer.from(event.data, 'base64'));
    await session!.send('Page.screencastFrameAck', { sessionId: event.sessionId });
  });

  await session.send('Page.startScreencast', {
    format: 'jpeg',
    quality: config.jpegQuality,
    maxWidth: config.viewport.width,
    maxHeight: config.viewport.height,
  });
}

export async function stop(): Promise<void> {
  if (!session) return;
  await session.send('Page.stopScreencast').catch(() => {});
  await session.detach().catch(() => {});
  session = null;
}
