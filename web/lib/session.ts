'use client';

import { useState, useRef, useCallback } from 'react';
import { createSession, deleteSession } from './api';
import { openSessionSocket, type FrameHandler, type SessionSocket } from './ws';
import type { AgentMessage, ClientMessage } from './protocol';

export type SessionState = 'idle' | 'starting' | 'live' | 'stopping' | 'error';

export interface SessionHook {
  state: SessionState;
  sessionId: string | null;
  currentUrl: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  send: (msg: ClientMessage) => void;
  onFrame: (handler: FrameHandler) => void;
}

export function useSession(): SessionHook {
  const [state, setState] = useState<SessionState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<SessionSocket | null>(null);
  const frameHandlerRef = useRef<FrameHandler | null>(null);

  const onFrame = useCallback((handler: FrameHandler) => {
    frameHandlerRef.current = handler;
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(msg);
  }, []);

  const start = useCallback(async () => {
    setState('starting');
    setError(null);
    setCurrentUrl('');

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
      (bitmap) => {
        frameHandlerRef.current?.(bitmap);
      },
      (msg: AgentMessage) => {
        if (msg.type === 'ready') {
          setState('live');
        } else if (msg.type === 'url') {
          setCurrentUrl(msg.value);
        } else if (msg.type === 'error') {
          setState('error');
          setError(msg.message);
        }
      },
    );
  }, []);

  const stop = useCallback(async () => {
    setState('stopping');
    socketRef.current?.close();
    socketRef.current = null;
    const id = sessionId;
    setSessionId(null);
    setCurrentUrl('');
    if (id) await deleteSession(id).catch(() => {});
    setState('idle');
  }, [sessionId]);

  return { state, sessionId, currentUrl, error, start, stop, send, onFrame };
}
