'use client';

import { useEffect, useRef } from 'react';
import type { SessionHook } from '../lib/session';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;

interface Props {
  session: SessionHook;
}

export default function Viewport({ session }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    session.onFrame((bitmap) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    });
  }, [session]);

  function toViewport(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIEWPORT_WIDTH / rect.width;
    const scaleY = VIEWPORT_HEIGHT / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  }

  function onMouseMove(e: React.MouseEvent) {
    const { x, y } = toViewport(e.clientX, e.clientY);
    session.send({ type: 'mouse', action: 'move', x, y, button: 'left', clickCount: 0 });
  }

  function onMouseDown(e: React.MouseEvent) {
    canvasRef.current?.focus();
    const { x, y } = toViewport(e.clientX, e.clientY);
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    session.send({ type: 'mouse', action: 'down', x, y, button, clickCount: 1 });
  }

  function onMouseUp(e: React.MouseEvent) {
    const { x, y } = toViewport(e.clientX, e.clientY);
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    session.send({ type: 'mouse', action: 'up', x, y, button, clickCount: 1 });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const { x, y } = toViewport(e.clientX, e.clientY);
    session.send({ type: 'wheel', x, y, deltaX: e.deltaX, deltaY: e.deltaY });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    e.preventDefault();
    session.send({
      type: 'key',
      action: 'down',
      key: e.key,
      code: e.code,
      text: e.key.length === 1 ? e.key : '',
    });
  }

  function onKeyUp(e: React.KeyboardEvent) {
    e.preventDefault();
    session.send({ type: 'key', action: 'up', key: e.key, code: e.code, text: '' });
  }

  const isLive = session.state === 'live';

  return (
    <div className="viewport-wrapper">
      <canvas
        ref={canvasRef}
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        tabIndex={0}
        onMouseMove={isLive ? onMouseMove : undefined}
        onMouseDown={isLive ? onMouseDown : undefined}
        onMouseUp={isLive ? onMouseUp : undefined}
        onWheel={isLive ? onWheel : undefined}
        onKeyDown={isLive ? onKeyDown : undefined}
        onKeyUp={isLive ? onKeyUp : undefined}
        onContextMenu={(e) => e.preventDefault()}
        style={{ outline: 'none', cursor: isLive ? 'crosshair' : 'default' }}
      />
    </div>
  );
}
