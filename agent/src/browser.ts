import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import config from './config.js';

export async function launch(): Promise<{ browser: Browser; page: Page }> {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      `--window-size=${config.viewport.width},${config.viewport.height}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport(config.viewport);

  return { browser, page };
}
