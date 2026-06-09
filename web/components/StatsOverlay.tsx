'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import type { SessionHook } from '@/lib/session';
import type { Stats } from '@/lib/ws';

export default function StatsOverlay({ session }: { session: SessionHook }) {
  const [stats, setStats] = useState<Stats>({ fps: 0, kbps: 0 });

  useEffect(() => {
    session.onStats(setStats);
  }, [session.onStats]);

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3 rounded-md border border-border bg-black/70 px-3 py-1.5 font-mono text-xs text-zinc-300 backdrop-blur-sm">
      <Activity className="size-3.5 text-emerald-400" />
      <span className="tabular-nums">
        <span className="text-zinc-500">fps</span> {stats.fps}
      </span>
      <span className="tabular-nums">
        <span className="text-zinc-500">net</span> {stats.kbps} KB/s
      </span>
    </div>
  );
}
