'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionState } from '@/lib/session';

const META: Record<
  SessionState,
  { label: string; dot: string; text: string; spin?: boolean; pulse?: boolean }
> = {
  idle: { label: 'Idle', dot: 'bg-zinc-500', text: 'text-zinc-400' },
  starting: { label: 'Connecting', dot: 'bg-amber-400', text: 'text-amber-400', spin: true },
  live: { label: 'Live', dot: 'bg-emerald-400', text: 'text-emerald-400', pulse: true },
  stopping: { label: 'Stopping', dot: 'bg-amber-400', text: 'text-amber-400', spin: true },
  error: { label: 'Error', dot: 'bg-red-500', text: 'text-red-400' },
};

export default function StatusBadge({ state }: { state: SessionState }) {
  const meta = META[state];

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium">
      {meta.spin ? (
        <Loader2 className={cn('size-3 animate-spin', meta.text)} />
      ) : (
        <span
          className={cn('size-2 rounded-full', meta.dot, meta.pulse && 'animate-status-pulse')}
        />
      )}
      <span className={cn('tabular-nums', meta.text)}>{meta.label}</span>
    </div>
  );
}
