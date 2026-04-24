#!/usr/bin/env node
import path from 'path';
import {
  createServer,
  KnowledgeStore,
  setKnowledgeStore,
  allocatePort,
} from '@metamask/client-mcp-core';

import { MetaMaskSessionManager } from './metamask-provider';
import { createMetaMaskE2EContext } from './capabilities/factory';
import { resolveRepoRoot } from './resolve-repo-root';

// Single shared KnowledgeStore instance used by both the global singleton
// (for session manager metadata recording) and createServer (for tool context).
const knowledgeStore = new KnowledgeStore();
setKnowledgeStore(knowledgeStore);

function releasePort(
  alloc: Awaited<ReturnType<typeof allocatePort>>,
): Promise<void> {
  return new Promise<void>((resolve) => alloc.server.close(() => resolve()));
}

const server = createServer({
  sessionManager: new MetaMaskSessionManager(),
  knowledgeStore,
  idleShutdownMs: 30 * 60 * 1000,
  logFilePath: path.join(resolveRepoRoot(), '.mm-daemon.log'),
  contextFactory: async () => {
    const [anvilAlloc, fixtureAlloc, mockAlloc] = await Promise.all([
      allocatePort(),
      allocatePort(),
      allocatePort(),
    ]);
    await Promise.all([
      releasePort(anvilAlloc),
      releasePort(fixtureAlloc),
      releasePort(mockAlloc),
    ]);
    const context = createMetaMaskE2EContext({
      config: {
        ports: {
          anvil: anvilAlloc.port,
          fixtureServer: fixtureAlloc.port,
        },
      },
      mockServer: {
        port: mockAlloc.port,
      },
    });
    return {
      ...context,
      allocatedPorts: {
        anvil: anvilAlloc.port,
        fixture: fixtureAlloc.port,
        mock: mockAlloc.port,
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
