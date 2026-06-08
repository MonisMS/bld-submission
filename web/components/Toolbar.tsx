'use client';

import { useState, useEffect } from 'react';
import type { SessionHook } from '../lib/session';

interface Props {
  session: SessionHook;
}

export default function Toolbar({ session }: Props) {
  const { state, currentUrl, error, start, stop, send } = session;
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (currentUrl) setUrlInput(currentUrl);
  }, [currentUrl]);

  function navigate() {
    let url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    send({ type: 'navigate', url });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') navigate();
  }

  const canStop = state === 'live' || state === 'starting';

  return (
    <div className="toolbar">
      <button onClick={canStop ? stop : start} disabled={state === 'stopping'}>
        {canStop ? 'Stop' : 'Start'}
      </button>

      <input
        type="text"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="https://example.com"
        disabled={state !== 'live'}
        className="url-bar"
      />

      <button onClick={navigate} disabled={state !== 'live'}>
        Go
      </button>

      <span className="status">
        {state === 'error' && error ? `error: ${error}` : state}
      </span>
    </div>
  );
}
