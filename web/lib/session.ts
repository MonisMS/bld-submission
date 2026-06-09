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
  error: string | null;
  startedAt: number | null;
  start: () => void;
  stop: () => void;
  navigate: (url: string) => void;
  reload: () => void;
  send: (msg: ClientMessage) => void;
  onFrame: (handler: FrameHandler) => void;
  onStats: (handler: StatsHandler) => void;
}

export function useSession(): SessionHook {
  const [state, setState] = useState<SessionState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const socketRef = useRef<SessionSocket | null>(null);
  const frameHandlerRef = useRef<FrameHandler | null>(null);
  const statsHandlerRef = useRef<StatsHandler | null>(null);
  const currentUrlRef = useRef('');

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
    socketRef.current?.send({ type: 'navigate', url });
  }, []);

  const reload = useCallback(() => {
    if (currentUrlRef.current) {
      socketRef.current?.send({ type: 'navigate', url: currentUrlRef.current });
    }
  }, []);

  const start = useCallback(async () => {
    setState('starting');
    setError(null);
    setCurrentUrl('');
    currentUrlRef.current = '';

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
        } else if (msg.type === 'error') {
          setState('error');
          setError(msg.message);
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
    currentUrlRef.current = '';
    setStartedAt(null);
    if (id) await deleteSession(id).catch(() => {});
    setState('idle');
  }, [sessionId]);

  return {
    state,
    sessionId,
    currentUrl,
    error,
    startedAt,
    start,
    stop,
    navigate,
    reload,
    send,
    onFrame,
    onStats,
  };
}
