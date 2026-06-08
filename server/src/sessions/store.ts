export interface SessionData {
  containerId: string;
  name: string;
  createdAt: Date;
}

const sessions = new Map<string, SessionData>();

export function add(id: string, data: SessionData): void {
  sessions.set(id, data);
}

export function get(id: string): SessionData | undefined {
  return sessions.get(id);
}

export function remove(id: string): void {
  sessions.delete(id);
}

export function list(): Array<{ id: string } & SessionData> {
  return Array.from(sessions.entries()).map(([id, data]) => ({ id, ...data }));
}
