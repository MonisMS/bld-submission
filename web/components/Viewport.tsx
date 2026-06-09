'use client';

import { useEffect, useRef } from 'react';
import StatsOverlay from './StatsOverlay';
import Landing from './Landing';
import type { SessionHook } from '@/lib/session';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;

export default function Viewport({ session }: { session: SessionHook }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLive = session.state === 'live';

  useEffect(() => {
    session.registerCanvas(canvasRef.current);
    return () => session.registerCanvas(null);
  }, [session.registerCanvas]);

  useEffect(() => {
    session.onFrame((bitmap) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    });
  }, [session.onFrame]);

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

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[oklch(0.07_0.012_255)]">
      {isLive && (
        <div className="shadow-[0_0_0_1px_oklch(1_0_0/8%),0_8px_48px_oklch(0_0_0/65%)] rounded-sm overflow-hidden animate-fade-in">
          <canvas
            ref={canvasRef}
            width={VIEWPORT_WIDTH}
            height={VIEWPORT_HEIGHT}
            tabIndex={0}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onWheel={onWheel}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onContextMenu={(e) => e.preventDefault()}
            className="block h-auto max-h-full w-auto max-w-full outline-none"
            style={{ cursor: 'crosshair', display: 'block' }}
          />
        </div>
      )}

      {!isLive && (
        <>
          {/* hidden canvas kept mounted so registerCanvas ref stays valid */}
          <canvas ref={canvasRef} width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT} className="hidden" />
          <div className="absolute inset-0">
            <Landing
              starting={session.state === 'starting'}
              error={session.state === 'error' ? session.error : null}
              onStart={session.start}
              onRetry={session.start}
            />
          </div>
        </>
      )}

      {isLive && <StatsOverlay session={session} />}
    </div>
  );
}
