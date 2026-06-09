'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import type { SessionHook } from '@/lib/session';
import type { Stats } from '@/lib/ws';

function fpsColor(fps: number) {
  if (fps >= 20) return 'bg-emerald-400';
  if (fps >= 10) return 'bg-amber-400';
  return 'bg-red-400';
}

export default function StatsOverlay({ session }: { session: SessionHook }) {
  const [stats, setStats] = useState<Stats>({ fps: 0, kbps: 0 });

  useEffect(() => {
    session.onStats(setStats);
  }, [session.onStats]);

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-3 rounded-lg border border-white/10 bg-black/75 px-3 py-2 font-mono text-xs backdrop-blur-md shadow-lg animate-fade-in">
      <Activity className="size-3.5 text-blue-400" />
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${fpsColor(stats.fps)}`} />
        <span className="text-white/40">fps</span>
        <span className="tabular-nums text-white/80">{stats.fps}</span>
      </div>
      <span className="text-white/15">·</span>
      <div className="flex items-center gap-1.5">
        <span className="text-white/40">net</span>
        <span className="tabular-nums text-white/80">{stats.kbps}</span>
        <span className="text-white/40">KB/s</span>
      </div>
    </div>
  );
}
