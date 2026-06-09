'use client';

import {
  Globe, MousePointerClick, Keyboard, Zap, Shield, MonitorPlay,
  AlertTriangle, RefreshCw, Loader2, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: Globe,             color: 'text-blue-400',    title: 'Full Navigation',   body: 'Browse any URL with back/forward history in a real Chromium.' },
  { icon: MousePointerClick, color: 'text-emerald-400', title: 'Live Interaction',  body: 'Mouse, scroll, and click events stream to the remote page instantly.' },
  { icon: Keyboard,          color: 'text-violet-400',  title: 'Keyboard Input',    body: 'Every keystroke is forwarded directly into the remote browser.' },
  { icon: Zap,               color: 'text-amber-400',   title: 'Low Latency',       body: 'Binary JPEG frames over WebSocket — no JSON serialisation overhead.' },
  { icon: Shield,            color: 'text-cyan-400',    title: 'Isolated Sessions', body: 'Each session runs in its own Docker container, fully sandboxed.' },
  { icon: MonitorPlay,       color: 'text-rose-400',    title: 'Screenshots',       body: 'Download the current browser frame as a PNG at any time.' },
];

interface Props {
  starting: boolean;
  error?: string | null;
  onStart?: () => void;
  onRetry?: () => void;
}

export default function Landing({ starting, error, onStart, onRetry }: Props) {

  /* ── Error ────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="grid-bg flex h-full w-full items-center justify-center p-8">
        <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-red-500/20 bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-red-500/25 bg-red-500/12">
            <AlertTriangle className="size-6 text-red-400" />
          </div>
          <p className="text-base font-semibold">Session failed</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} className="mt-6 gap-2" size="sm">
              <RefreshCw className="size-3.5" aria-hidden />
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ── Starting ─────────────────────────────────────────────── */
  if (starting) {
    return (
      <div className="grid-bg flex h-full w-full items-center justify-center p-8">
        <div className="animate-slide-up w-full max-w-md rounded-2xl border border-white/8 bg-card p-10 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10">
            <Loader2 className="size-7 animate-spin text-amber-400" />
          </div>
          <p className="text-lg font-semibold">Launching Browser</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Booting a sandboxed Chromium container…
          </p>

          <ol aria-label="Boot progress" className="mt-8 space-y-3 rounded-xl border border-white/8 bg-background/60 p-5 text-left">
            {[
              'Pulling container image',
              'Booting Chromium',
              'Opening WebSocket stream',
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                  i === 0 ? 'border border-amber-400/30 bg-amber-400/12' : 'border border-white/8 bg-white/4'
                }`}>
                  {i === 0
                    ? <Loader2 className="size-3 animate-spin text-amber-400" />
                    : <span className="size-1.5 rounded-full bg-muted-foreground/25" />
                  }
                </span>
                <span className={i === 0 ? 'text-foreground/80' : 'text-muted-foreground/45'}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  /* ── Idle ─────────────────────────────────────────────────── */
  return (
    <div className="grid-bg flex h-full w-full items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-5 animate-slide-up">

        {/* Hero card */}
        <div className="rounded-2xl border border-white/8 bg-card p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">

            {/* Icon */}
            <div className="mb-6 flex size-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 sm:mb-0 animate-glow-pulse">
              <MonitorPlay className="size-7 text-emerald-400" />
            </div>

            {/* Copy */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">Remote Browser Control</h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Sandbox a real Chromium in Docker. Stream it live over WebSocket.
                Control it fully — mouse, keyboard, and navigation — right from your browser.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {['Chromium', 'Docker', 'WebSocket', 'CDP'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>

              {onStart && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={onStart}
                    className={[
                      'h-11 gap-2.5 px-8 text-sm font-semibold border-0',
                      'bg-emerald-500 text-black',
                      'hover:bg-emerald-400',
                      'shadow-[0_0_20px_oklch(0.72_0.19_162_/_35%)]',
                      'hover:shadow-[0_0_28px_oklch(0.75_0.18_162_/_50%)]',
                      'transition-all duration-200',
                    ].join(' ')}
                  >
                    <Play className="size-4" aria-hidden />
                    Launch Browser
                  </Button>
                  <p className="text-xs text-muted-foreground/60">
                    or press <kbd data-slot="kbd">Ctrl+L</kbd> after launch to set a URL
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-white/6 bg-card/70 p-5 backdrop-blur-sm transition-all duration-200 hover:border-white/12 hover:bg-card"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-white/8 bg-background/80">
                <f.icon className={`size-4 ${f.color}`} aria-hidden />
              </div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
