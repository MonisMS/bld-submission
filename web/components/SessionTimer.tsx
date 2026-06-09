'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function format(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function SessionTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
      <Clock className="size-3 text-blue-400/65" />
      <span className="text-white/50">{format(Math.max(0, now - startedAt))}</span>
    </div>
  );
}
