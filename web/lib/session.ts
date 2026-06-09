'use client';

import { useState, useRef, useCallback } from 'react';
import { createSession, deleteSession } from './api';
import {
  openSessionSocket,
  type FrameHandler,
  type StatsHandler,
  type SessionSocket,
} from './ws';
import type { AgentMessage, ClientMessage } from './protocol';

export type SessionState = 'idle' | 'starting' | 'live' | 'stopping' | 'error';

export interface SessionHook {
  state: SessionState;
  sessionId: string | null;
  currentUrl: string;
  title: string;
  error: string | null;
  startedAt: number | null;
  canGoBack: boolean;
  canGoForward: boolean;
  start: () => void;
  stop: () => void;
  navigate: (url: string) => void;
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  send: (msg: ClientMessage) => void;
  onFrame: (handler: FrameHandler) => void;
  onStats: (handler: StatsHandler) => void;
  registerCanvas: (canvas: HTMLCanvasElement | null) => void;
  screenshot: () => void;
}

export function useSession(): SessionHook {
  const [state, setState] = useState<SessionState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const socketRef = useRef<SessionSocket | null>(null);
  const frameHandlerRef = useRef<FrameHandler | null>(null);
  const statsHandlerRef = useRef<StatsHandler | null>(null);
  const currentUrlRef = useRef('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Navigation history tracking
  const navHistoryRef = useRef<string[]>([]);
  const navIndexRef = useRef(-1);
  const navPendingRef = useRef<'back' | 'forward' | null>(null);

  function updateNavState(history: string[], index: number) {
    navHistoryRef.current = history;
    navIndexRef.current = index;
    setCanGoBack(index > 0);
    setCanGoForward(index < history.length - 1);
  }

  const onFrame = useCallback((handler: FrameHandler) => {
    frameHandlerRef.current = handler;
  }, []);

  const onStats = useCallback((handler: StatsHandler) => {
    statsHandlerRef.current = handler;
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(msg);
  }, []);

  const navigate = useCallback((url: string) => {
    navPendingRef.current = null;
    socketRef.current?.send({ type: 'navigate', url });
  }, []);

  const reload = useCallback(() => {
    if (currentUrlRef.current) {
      navPendingRef.current = null;
      socketRef.current?.send({ type: 'navigate', url: currentUrlRef.current });
    }
  }, []);

  const goBack = useCallback(() => {
    if (navIndexRef.current > 0) {
      navPendingRef.current = 'back';
      socketRef.current?.send({ type: 'navigate-back' });
    }
  }, []);

  const goForward = useCallback(() => {
    if (navIndexRef.current < navHistoryRef.current.length - 1) {
      navPendingRef.current = 'forward';
      socketRef.current?.send({ type: 'navigate-forward' });
    }
  }, []);

  const registerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  const screenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  const start = useCallback(async () => {
    // Clean up any previous socket before starting
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setState('starting');
    setError(null);
    setCurrentUrl('');
    setTitle('');
    currentUrlRef.current = '';
    navHistoryRef.current = [];
    navIndexRef.current = -1;
    navPendingRef.current = null;
    setCanGoBack(false);
    setCanGoForward(false);

    let id: string;
    try {
      const session = await createSession();
      id = session.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState('error');
      setError(msg);
      return;
    }

    setSessionId(id);

    socketRef.current = openSessionSocket(
      id,
      (bitmap) => frameHandlerRef.current?.(bitmap),
      (msg: AgentMessage) => {
        if (msg.type === 'ready') {
          setStartedAt(Date.now());
          setState('live');
        } else if (msg.type === 'url') {
          currentUrlRef.current = msg.value;
          setCurrentUrl(msg.value);

          const history = navHistoryRef.current;
          const index = navIndexRef.current;
          const pending = navPendingRef.current;
          navPendingRef.current = null;

          if (pending === 'back') {
            updateNavState(history, Math.max(0, index - 1));
          } else if (pending === 'forward') {
            updateNavState(history, Math.min(history.length - 1, index + 1));
          } else {
            const newHistory = [...history.slice(0, index + 1), msg.value];
            updateNavState(newHistory, newHistory.length - 1);
          }
        } else if (msg.type === 'title') {
          setTitle(msg.value);
        } else if (msg.type === 'error') {
          setState('error');
          setError(msg.message);
          socketRef.current?.close();
          socketRef.current = null;
        }
      },
      (stats) => statsHandlerRef.current?.(stats),
    );
  }, []);

  const stop = useCallback(async () => {
    setState('stopping');
    socketRef.current?.close();
    socketRef.current = null;
    const id = sessionId;
    setSessionId(null);
    setCurrentUrl('');
    setTitle('');
    currentUrlRef.current = '';
    navHistoryRef.current = [];
    navIndexRef.current = -1;
    navPendingRef.current = null;
    setCanGoBack(false);
    setCanGoForward(false);
    setStartedAt(null);
    if (id) await deleteSession(id).catch(() => {});
    setState('idle');
  }, [sessionId]);

  return {
    state,
    sessionId,
    currentUrl,
    title,
    error,
    startedAt,
    canGoBack,
    canGoForward,
    start,
    stop,
    navigate,
    reload,
    goBack,
    goForward,
    send,
    onFrame,
    onStats,
    registerCanvas,
    screenshot,
  };
}
