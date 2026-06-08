'use client';

import { useSession } from '../lib/session';
import Toolbar from '../components/Toolbar';
import Viewport from '../components/Viewport';

export default function Home() {
  const session = useSession();

  return (
    <main className="page">
      <Toolbar session={session} />
      <Viewport session={session} />
    </main>
  );
}
