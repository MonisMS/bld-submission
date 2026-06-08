import { Router } from 'express';
import { nanoid } from 'nanoid';
import * as manager from '../docker/manager.js';
import * as store from '../sessions/store.js';

const router = Router();

router.post('/', async (_req, res) => {
  const id = nanoid(10);
  try {
    const { name } = await manager.create(id);
    store.add(id, { containerId: name, name, createdAt: new Date() });
    res.status(201).json({ id, host: name });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`session create failed: ${message}`);
    res.status(500).json({ error: message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const session = store.get(id);
  if (!session) {
    res.status(404).json({ error: 'session not found' });
    return;
  }
  store.remove(id);
  await manager.destroy(id).catch((err: unknown) => {
    console.error(`destroy failed for ${id}:`, err);
  });
  res.status(204).end();
});

router.get('/', (_req, res) => {
  res.json(store.list());
});

export default router;
