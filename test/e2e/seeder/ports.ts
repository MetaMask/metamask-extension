import { createServer, type Server } from 'net';

export type PortRange = {
  endPort: number;
  startPort: number;
};

const MAX_PORT = 65535;
const MIN_PORT = 1;

export function assertValidPort(port: number, label: string): void {
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(
      `${label} must be an integer from ${MIN_PORT} to ${MAX_PORT}`,
    );
  }
}

export async function getAvailablePorts(
  count: number,
  excludedPorts: Iterable<number> = [],
): Promise<number[]> {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Port count must be a non-negative integer');
  }

  const excluded = new Set(excludedPorts);
  const servers: { port: number; server: Server }[] = [];

  try {
    while (servers.length < count) {
      const allocation = await openEphemeralServer();
      if (excluded.has(allocation.port)) {
        await closeServer(allocation.server);
        continue;
      }

      excluded.add(allocation.port);
      servers.push(allocation);
    }

    return servers.map(({ port }) => port);
  } finally {
    await Promise.all(servers.map(({ server }) => closeServer(server)));
  }
}

export async function isTcpPortAvailable(port: number): Promise<boolean> {
  assertValidPort(port, 'Port');

  try {
    const server = await listenOnTcpPort(port);
    await closeServer(server);
    return true;
  } catch {
    return false;
  }
}

export async function isTcpPortRangeAvailable(
  startPort: number,
  count: number,
): Promise<boolean> {
  assertValidPort(startPort, 'Start port');
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('Port range count must be a positive integer');
  }

  const endPort = startPort + count - 1;
  assertValidPort(endPort, 'End port');

  const servers: Server[] = [];

  try {
    for (let offset = 0; offset < count; offset += 1) {
      servers.push(await listenOnTcpPort(startPort + offset));
    }
    return true;
  } catch {
    return false;
  } finally {
    await Promise.all(servers.map((server) => closeServer(server)));
  }
}

export function parsePortRange(range: string): PortRange {
  const match = range.match(/^(\d+)-(\d+)$/u);
  if (!match) {
    throw new Error(`Invalid port range: ${range}`);
  }

  const startPort = Number(match[1]);
  const endPort = Number(match[2]);
  assertValidPort(startPort, 'Start port');
  assertValidPort(endPort, 'End port');

  if (endPort < startPort) {
    throw new Error(`Invalid port range: ${range}`);
  }

  return { endPort, startPort };
}

async function openEphemeralServer(): Promise<{
  port: number;
  server: Server;
}> {
  return await new Promise((resolvePromise, rejectPromise) => {
    const server = createServer();
    server.unref();
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address?.port) {
        resolvePromise({ port: address.port, server });
        return;
      }

      server.close();
      rejectPromise(new Error('Unable to allocate an available port'));
    });
  });
}

async function listenOnTcpPort(port: number): Promise<Server> {
  return await new Promise((resolvePromise, rejectPromise) => {
    const server = createServer();
    server.unref();
    server.once('error', rejectPromise);
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
  });
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.close((error) => {
      if (error) {
        rejectPromise(error);
        return;
      }
      resolvePromise();
    });
  });
}
