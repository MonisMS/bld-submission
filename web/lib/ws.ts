import type { AgentMessage, ClientMessage } from './protocol';

export type FrameHandler = (bitmap: ImageBitmap) => void;
export type ControlHandler = (msg: AgentMessage) => void;
export type Stats = { fps: number; kbps: number };
export type StatsHandler = (stats: Stats) => void;

export interface SessionSocket {
  send: (msg: ClientMessage) => void;
  close: () => void;
}

export function openSessionSocket(
  sessionId: string,
  onFrame: FrameHandler,
  onControl: ControlHandler,
  onStats: StatsHandler,
): SessionSocket {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';
  const wsUrl = base.replace(/^http/, 'ws') + `/ws?session=${sessionId}`;
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'blob';

  let decoding = false;
  let frames = 0;
  let bytes = 0;

  const statsTimer = setInterval(() => {
    onStats({ fps: frames, kbps: Math.round(bytes / 1024) });
    frames = 0;
    bytes = 0;
  }, 1000);

  ws.onmessage = (event) => {
    if (event.data instanceof Blob) {
      frames += 1;
      bytes += event.data.size;
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

  ws.onerror = () => {
    clearInterval(statsTimer);
    onControl({ type: 'error', message: 'WebSocket connection failed' });
  };

  ws.onclose = () => {
    clearInterval(statsTimer);
  };

  return {
    send(msg) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    close() {
      clearInterval(statsTimer);
      ws.close();
    },
  };
}
