import { type Page, type KeyInput } from 'puppeteer-core';

export type MouseMsg = {
  type: 'mouse';
  action: 'move' | 'down' | 'up';
  x: number;
  y: number;
  button: 'left' | 'middle' | 'right';
  clickCount: number;
};

export type WheelMsg = {
  type: 'wheel';
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
};

export type KeyMsg = {
  type: 'key';
  action: 'down' | 'up';
  key: string;
  code: string;
  text: string;
};

export type NavigateMsg = {
  type: 'navigate';
  url: string;
};

export type NavigateBackMsg = {
  type: 'navigate-back';
};

export type NavigateForwardMsg = {
  type: 'navigate-forward';
};

export type InputMsg = MouseMsg | WheelMsg | KeyMsg | NavigateMsg | NavigateBackMsg | NavigateForwardMsg;

const KEY_MAP: Record<string, string> = {
  ' ': 'Space',
  'ArrowUp': 'ArrowUp',
  'ArrowDown': 'ArrowDown',
  'ArrowLeft': 'ArrowLeft',
  'ArrowRight': 'ArrowRight',
  'Enter': 'Enter',
  'Backspace': 'Backspace',
  'Tab': 'Tab',
  'Escape': 'Escape',
  'Delete': 'Delete',
  'Home': 'Home',
  'End': 'End',
  'PageUp': 'PageUp',
  'PageDown': 'PageDown',
  'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
  'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8',
  'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
  'Shift': 'Shift', 'Control': 'Control', 'Alt': 'Alt', 'Meta': 'Meta',
};

function mapKey(key: string): KeyInput {
  return (KEY_MAP[key] ?? key) as KeyInput;
}

export async function dispatch(page: Page, msg: InputMsg): Promise<void> {
  switch (msg.type) {
    case 'mouse':
      if (msg.action === 'move') {
        await page.mouse.move(msg.x, msg.y);
      } else if (msg.action === 'down') {
        await page.mouse.down({ button: msg.button, clickCount: msg.clickCount });
      } else {
        await page.mouse.up({ button: msg.button, clickCount: msg.clickCount });
      }
      break;

    case 'wheel':
      await page.mouse.move(msg.x, msg.y);
      await page.mouse.wheel({ deltaX: msg.deltaX, deltaY: msg.deltaY });
      break;

    case 'key': {
      const k = mapKey(msg.key);
      if (msg.action === 'down') {
        if (msg.text.length === 1) {
          await page.keyboard.sendCharacter(msg.text);
        } else {
          await page.keyboard.down(k);
        }
      } else {
        await page.keyboard.up(k).catch(() => {});
      }
      break;
    }

    case 'navigate':
      await page.goto(msg.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      break;

    case 'navigate-back':
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
      break;

    case 'navigate-forward':
      await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
  }
}
