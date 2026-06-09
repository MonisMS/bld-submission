'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionState } from '@/lib/session';

type Meta = {
  label: string;
  wrap: string;
  dot?: string;
  text: string;
  spin?: boolean;
  pulse?: boolean;
};

const META: Record<SessionState, Meta> = {
  idle:     {
    label: 'Idle',
    wrap: 'border-white/10 bg-white/5',
    dot:  'bg-zinc-500',
    text: 'text-zinc-400',
  },
  starting: {
    label: 'Connecting',
    wrap: 'border-amber-400/30 bg-amber-400/10',
    text: 'text-amber-300',
    spin: true,
  },
  live: {
    label: 'Live',
    wrap: 'border-emerald-500/35 bg-emerald-500/12 shadow-[0_0_12px_oklch(0.72_0.19_162_/_22%)]',
    dot:  'bg-emerald-400',
    text: 'text-emerald-300 font-semibold',
    pulse: true,
  },
  stopping: {
    label: 'Stopping',
    wrap: 'border-amber-400/30 bg-amber-400/10',
    text: 'text-amber-300',
    spin: true,
  },
  error: {
    label: 'Error',
    wrap: 'border-red-400/30 bg-red-400/10',
    dot:  'bg-red-400',
    text: 'text-red-300',
  },
};

export default function StatusBadge({ state }: { state: SessionState }) {
  const m = META[state];
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300',
        m.wrap,
        state === 'live' && 'animate-glow-pulse',
      )}
    >
      {m.spin
        ? <Loader2 className={cn('size-3 animate-spin', m.text)} />
        : <span className={cn('size-1.5 rounded-full', m.dot, m.pulse && 'animate-status-pulse')} />
      }
      <span className={cn(m.text)}>{m.label}</span>
    </div>
  );
}
