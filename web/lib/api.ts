const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

export async function createSession(): Promise<{ id: string; host: string }> {
  const res = await fetch(`${base}/api/sessions`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  await fetch(`${base}/api/sessions/${id}`, { method: 'DELETE' });
}
