'use client';

import { MousePointerClick, Keyboard, Globe, Play } from 'lucide-react';

const FEATURES = [
  { icon: Globe, title: 'Navigate', body: 'Type any URL and browse a real headless Chromium.' },
  { icon: MousePointerClick, title: 'Click & scroll', body: 'Your mouse drives the remote page in real time.' },
  { icon: Keyboard, title: 'Type', body: 'Keyboard input is forwarded straight into the page.' },
];

export default function Landing({ starting }: { starting: boolean }) {
  return (
    <div className="grid-bg flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card/80 p-8 text-center shadow-2xl backdrop-blur-sm">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-border bg-background">
          <Play className="size-5 text-emerald-400" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Remote Browser Control</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          {starting
            ? 'Booting a browser container and connecting the live stream…'
            : 'Press Start to launch a headless browser in a container and drive it live from here.'}
        </p>

        <div className="mt-7 space-y-3 text-left">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <f.icon className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
