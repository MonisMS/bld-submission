import type { AgentMessage, ClientMessage } from './protocol';

export type FrameHandler = (bitmap: ImageBitmap) => void;
export type ControlHandler = (msg: AgentMessage) => void;

export interface SessionSocket {
  send: (msg: ClientMessage) => void;
  close: () => void;
}

export function openSessionSocket(
  sessionId: string,
  onFrame: FrameHandler,
  onControl: ControlHandler,
): SessionSocket {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';
  const wsUrl = base.replace(/^http/, 'ws') + `/ws?session=${sessionId}`;
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'blob';

  let decoding = false;

  ws.onmessage = (event) => {
    if (event.data instanceof Blob) {
      if (decoding) return;
      decoding = true;
      createImageBitmap(event.data)
        .then((bitmap) => {
          onFrame(bitmap);
        })
        .finally(() => {
          decoding = false;
        });
    } else {
      try {
        const msg = JSON.parse(event.data as string) as AgentMessage;
        onControl(msg);
      } catch {
        // ignore malformed control messages
      }
    }
  };

  return {
    send(msg) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    close() {
      ws.close();
    },
  };
}
