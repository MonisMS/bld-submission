import Docker from 'dockerode';
import config from '../config.js';

const docker = new Docker();

export async function ensureNetwork(): Promise<void> {
  const networks = await docker.listNetworks();
  const exists = networks.some((n) => n.Name === config.networkName);
  if (!exists) {
    await docker.createNetwork({ Name: config.networkName, Driver: 'bridge' });
    console.log(`network created: ${config.networkName}`);
  }
}

export async function create(id: string): Promise<{ name: string }> {
  const name = `rbc-browser-${id}`;

  const container = await docker.createContainer({
    Image: config.agentImage,
    name,
    Labels: { 'rbc.session': id },
    HostConfig: {
      NetworkMode: config.networkName,
      Memory: 512 * 1024 * 1024,
      Tmpfs: { '/dev/shm': 'size=256m' },
    },
  });

  await container.start();
  console.log(`container started: ${name}`);
  return { name };
}

export async function destroy(id: string): Promise<void> {
  const name = `rbc-browser-${id}`;
  const containers = await docker.listContainers({
    all: true,
    filters: JSON.stringify({ name: [name] }),
  });

  for (const info of containers) {
    const container = docker.getContainer(info.Id);
    await container.stop({ t: 2 }).catch(() => {});
    await container.remove({ force: true }).catch(() => {});
    console.log(`container removed: ${name}`);
  }
}

export async function reap(): Promise<void> {
  const containers = await docker.listContainers({
    all: true,
    filters: JSON.stringify({ label: ['rbc.session'] }),
  });

  if (containers.length === 0) return;
  console.log(`reaping ${containers.length} stale container(s)`);

  await Promise.all(
    containers.map(async (info) => {
      const container = docker.getContainer(info.Id);
      await container.stop({ t: 2 }).catch(() => {});
      await container.remove({ force: true }).catch(() => {});
    }),
  );
}
