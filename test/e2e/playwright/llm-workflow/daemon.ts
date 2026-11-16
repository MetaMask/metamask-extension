#!/usr/bin/env node
import path from 'path';
import { createServer, allocatePort } from '@metamask/client-mcp-core';

import { MetaMaskSessionManager } from './metamask-provider';
import { createMetaMaskE2EContext } from './capabilities/factory';
import { resolveRepoRoot } from './resolve-repo-root';

function releasePort(
  alloc: Awaited<ReturnType<typeof allocatePort>>,
): Promise<void> {
  return new Promise<void>((resolve) => alloc.server.close(() => resolve()));
}

const server = createServer({
  sessionManager: new MetaMaskSessionManager(),
  idleShutdownMs: 30 * 60 * 1000,
  logFilePath: path.join(resolveRepoRoot(), '.mm-daemon.log'),
  contextFactory: async () => {
    const [anvilAlloc, fixtureAlloc] = await Promise.all([
      allocatePort(),
      allocatePort(),
    ]);
    await Promise.all([releasePort(anvilAlloc), releasePort(fixtureAlloc)]);
    const context = createMetaMaskE2EContext({
      config: {
        ports: {
          anvil: anvilAlloc.port,
          fixtureServer: fixtureAlloc.port,
        },
      },
    });
    return {
      ...context,
      allocatedPorts: {
        anvil: anvilAlloc.port,
        fixture: fixtureAlloc.port,
      },
    };
  },
});

server
  .start()
  .then((state) => {
    process.stderr.write(`MetaMask daemon started on port ${state.port}\n`);
  })
  .catch((error: Error) => {
    process.stderr.write(`Failed to start daemon: ${error.message}\n`);
    process.exit(1);
  });
