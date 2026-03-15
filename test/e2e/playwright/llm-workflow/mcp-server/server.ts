#!/usr/bin/env node

import {
  createMcpServer,
  setSessionManager,
  createKnowledgeStore,
  setKnowledgeStore,
} from '@metamask/client-mcp-core';

import type { WorkflowContext } from '@metamask/client-mcp-core';
import { createMetaMaskE2EContext } from '../capabilities/factory';
import { metaMaskSessionManager } from './metamask-provider';

function initializeWorkflowContext(): WorkflowContext {
  return createMetaMaskE2EContext();
}

async function main() {
  const partialContext = initializeWorkflowContext();
  metaMaskSessionManager.setWorkflowContext(partialContext);

  setKnowledgeStore(createKnowledgeStore());
  setSessionManager(metaMaskSessionManager);

  const server = createMcpServer({
    name: 'metamask-visual-testing',
    version: '1.0.0',
    onCleanup: async () => {
      await metaMaskSessionManager.cleanup();
    },
  });

  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
