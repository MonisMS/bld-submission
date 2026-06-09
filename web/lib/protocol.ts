export type ReadyMessage = {
  type: 'ready';
  viewport: { width: number; height: number };
};

export type UrlMessage = {
  type: 'url';
  value: string;
};

export type ErrorMessage = {
  type: 'error';
  message: string;
};

export type MouseMessage = {
  type: 'mouse';
  action: 'move' | 'down' | 'up';
  x: number;
  y: number;
  button: 'left' | 'right' | 'middle';
  clickCount: number;
};

export type WheelMessage = {
  type: 'wheel';
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
};

export type KeyMessage = {
  type: 'key';
  action: 'down' | 'up';
  key: string;
  code: string;
  text: string;
};

export type NavigateMessage = {
  type: 'navigate';
  url: string;
};

export type NavigateBackMessage = {
  type: 'navigate-back';
};

export type NavigateForwardMessage = {
  type: 'navigate-forward';
};

export type TitleMessage = {
  type: 'title';
  value: string;
};

export type AgentMessage = ReadyMessage | UrlMessage | ErrorMessage | TitleMessage;
export type ClientMessage = MouseMessage | WheelMessage | KeyMessage | NavigateMessage | NavigateBackMessage | NavigateForwardMessage;
