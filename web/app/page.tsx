'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/session';
import Toolbar from '@/components/Toolbar';
import Viewport from '@/components/Viewport';

export default function Home() {
  const session = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (session.state === 'error' && session.error) {
      toast.error('Session error', { description: session.error });
    }
  }, [session.state, session.error]);

  useEffect(() => {
    document.title = session.title
      ? `${session.title} — Remote Browser`
      : 'Remote Browser Control';
  }, [session.title]);

  return (
    <main ref={containerRef} className="flex h-screen flex-col bg-background">
      <Toolbar session={session} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} />
      <Viewport session={session} />
    </main>
  );
}
