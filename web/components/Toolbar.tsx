'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Play, Square, RotateCw, Globe, ArrowRight,
  Maximize2, Minimize2, ArrowLeft, ChevronRight,
  Camera, Copy, Check,
} from 'lucide-react';
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

function Divider() {
  return <div aria-hidden className="h-6 w-px shrink-0 bg-white/10" />;
}

export default function Toolbar({ session, fullscreen, onToggleFullscreen }: Props) {
  const {
    state, currentUrl, startedAt,
    canGoBack, canGoForward,
    start, stop, navigate, reload, goBack, goForward, screenshot,
  } = session;

  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied,    setCopied]    = useState(false);

  /* Derived URL bar: show currentUrl when not actively editing */
  const urlInput = isEditing ? editValue : (currentUrl ?? '');

  /* Ctrl/Cmd+L → focus & select the URL bar */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        const el = document.getElementById('url-bar') as HTMLInputElement | null;
        if (el) { el.focus(); el.select(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isLive  = state === 'live';
  const isBusy  = state === 'starting' || state === 'stopping';
  const canStop = state === 'live' || state === 'starting';

  function go() {
    let url = (isEditing ? editValue : currentUrl ?? '').trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    navigate(url);
    setIsEditing(false);
  }

  const copyUrl = useCallback(() => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [currentUrl]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/8 bg-card px-4">

      {/* ── Session toggle ───────────────────────────── */}
      {canStop ? (
        <Button
          onClick={stop}
          disabled={isBusy}
          variant="destructive"
          className="h-9 shrink-0 gap-2 px-5 text-sm font-medium"
        >
          <Square className="size-3.5" aria-hidden />
          Stop
        </Button>
      ) : (
        <Button
          onClick={start}
          disabled={isBusy}
          className={[
            'h-9 shrink-0 gap-2 px-5 text-sm font-semibold border-0',
            'bg-emerald-500 text-black',
            'hover:bg-emerald-400',
            'shadow-[0_0_16px_oklch(0.72_0.19_162_/_40%)]',
            'hover:shadow-[0_0_20px_oklch(0.75_0.18_162_/_55%)]',
            'transition-all duration-200',
          ].join(' ')}
        >
          <Play className="size-3.5" aria-hidden />
          Start
        </Button>
      )}

      <Divider />

      {/* ── Navigation cluster ──────────────────────── */}
      <nav
        aria-label="Browser navigation"
        className="flex shrink-0 items-center gap-0.5 rounded-lg border border-white/8 bg-white/4 p-1"
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Go back"
                onClick={goBack}
                disabled={!isLive || !canGoBack}
                variant="ghost"
                size="icon"
                className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/8 disabled:opacity-30"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Button>
            }
          />
          <TooltipContent>
            Back
            <kbd data-slot="kbd">Alt+←</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Go forward"
                onClick={goForward}
                disabled={!isLive || !canGoForward}
                variant="ghost"
                size="icon"
                className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/8 disabled:opacity-30"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            }
          />
          <TooltipContent>
            Forward
            <kbd data-slot="kbd">Alt+→</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Reload page"
                onClick={reload}
                disabled={!isLive}
                variant="ghost"
                size="icon"
                className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/8 disabled:opacity-30"
              >
                <RotateCw className="size-4" aria-hidden />
              </Button>
            }
          />
          <TooltipContent>
            Reload
            <kbd data-slot="kbd">Ctrl+R</kbd>
          </TooltipContent>
        </Tooltip>
      </nav>

      <Divider />

      {/* ── Address bar ─────────────────────────────── */}
      <div className="relative min-w-0 flex-1">
        <Globe
          aria-hidden
          className={`pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 transition-colors duration-200 ${
            isLive ? 'text-blue-400' : 'text-muted-foreground/40'
          }`}
        />
        <Input
          id="url-bar"
          value={urlInput}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          onFocus={(e) => { setIsEditing(true); setEditValue(e.target.value); (e.target as HTMLInputElement).select(); }}
          onBlur={() => setIsEditing(false)}
          placeholder="https://example.com"
          disabled={!isLive}
          spellCheck={false}
          aria-label="URL bar"
          className={[
            'h-9 rounded-lg border-white/10 bg-background',
            'pl-10 pr-9 font-mono text-sm',
            'placeholder:text-muted-foreground/35',
            'focus:border-blue-500/45 focus:ring-2 focus:ring-blue-500/15',
            'transition-all duration-150',
          ].join(' ')}
        />
        {currentUrl && (
          <button
            onClick={copyUrl}
            aria-label={copied ? 'Copied' : 'Copy URL'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/45 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied
              ? <Check className="size-3.5 text-emerald-400" aria-hidden />
              : <Copy className="size-3.5" aria-hidden />
            }
          </button>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              onClick={go}
              disabled={!isLive}
              variant="secondary"
              className="h-9 shrink-0 gap-1.5 px-4 text-sm border border-white/8"
            >
              Go
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
          }
        />
        <TooltipContent>
          Navigate
          <kbd data-slot="kbd">Enter</kbd>
        </TooltipContent>
      </Tooltip>

      <Divider />

      {/* ── Right actions ───────────────────────────── */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label="Save screenshot"
              onClick={screenshot}
              disabled={!isLive}
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Camera className="size-4" aria-hidden />
            </Button>
          }
        />
        <TooltipContent>Screenshot</TooltipContent>
      </Tooltip>

      <div className="flex shrink-0 items-center gap-3">
        {isLive && startedAt !== null && <SessionTimer startedAt={startedAt} />}
        <StatusBadge state={state} />
      </div>

      <Divider />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={onToggleFullscreen}
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            >
              {fullscreen
                ? <Minimize2 className="size-4" aria-hidden />
                : <Maximize2 className="size-4" aria-hidden />
              }
            </Button>
          }
        />
        <TooltipContent>
          {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          <kbd data-slot="kbd">F</kbd>
        </TooltipContent>
      </Tooltip>

    </header>
  );
}
