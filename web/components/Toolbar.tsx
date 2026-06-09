'use client';

import { useState, useEffect } from 'react';
import { Play, Square, RotateCw, Globe, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import StatusBadge from './StatusBadge';
import SessionTimer from './SessionTimer';
import type { SessionHook } from '@/lib/session';

interface Props {
  session: SessionHook;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function Toolbar({ session, fullscreen, onToggleFullscreen }: Props) {
  const { state, currentUrl, startedAt, start, stop, navigate, reload } = session;
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (currentUrl) setUrlInput(currentUrl);
  }, [currentUrl]);

  const isLive = state === 'live';
  const isBusy = state === 'starting' || state === 'stopping';
  const canStop = state === 'live' || state === 'starting';

  function go() {
    let url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    navigate(url);
  }

  return (
    <header className="flex items-center gap-2 border-b border-border bg-card/40 px-3 py-2 backdrop-blur-sm">
      <Button
        onClick={canStop ? stop : start}
        disabled={isBusy}
        variant={canStop ? 'destructive' : 'default'}
        size="sm"
        className="gap-1.5"
      >
        {canStop ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
        {canStop ? 'Stop' : 'Start'}
      </Button>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button onClick={reload} disabled={!isLive} variant="outline" size="icon" className="size-8">
              <RotateCw className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Reload page</TooltipContent>
      </Tooltip>

      <div className="relative flex-1">
        <Globe className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          placeholder="https://example.com"
          disabled={!isLive}
          className="h-8 pl-8 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      <Button onClick={go} disabled={!isLive} variant="secondary" size="sm" className="gap-1.5">
        Go
        <ArrowRight className="size-3.5" />
      </Button>

      <div className="mx-1 flex items-center gap-3">
        {isLive && startedAt !== null && <SessionTimer startedAt={startedAt} />}
        <StatusBadge state={state} />
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button onClick={onToggleFullscreen} variant="ghost" size="icon" className="size-8">
              {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </Button>
          }
        />
        <TooltipContent>{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
      </Tooltip>
    </header>
  );
}
