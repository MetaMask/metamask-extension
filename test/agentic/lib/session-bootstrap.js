'use strict';

/**
 * Bootstrap session manager + tool handler registry.
 * Mirrors the initialization pattern from mcp-server/server.ts.
 */

const {
  setSessionManager,
  setKnowledgeStore,
  createKnowledgeStore,
  buildToolHandlersRecord,
  setToolRegistry,
  setToolValidator,
  safeValidateToolInput,
} = require('@metamask/client-mcp-core');
const { CdpSessionManager } = require('./cdp-session-manager');

let bootstrapped = false;
let handlerRecord = null;

function normalizeName(name) {
  return name.startsWith('mm_') ? name : `mm_${name}`;
}

async function callHandler(toolName, input) {
  if (!handlerRecord) throw new Error('Call bootstrapSession() before calling handlers');

  const prefixed = normalizeName(toolName);
  const handler = handlerRecord[prefixed];
  if (!handler) throw new Error(`Unknown tool: ${toolName} (looked up as ${prefixed})`);

  return handler(input);
}

function bootstrapSession() {
  const { metaMaskSessionManager } = require('../../mcp-server/metamask-provider');
  if (!bootstrapped) {
    const { createMetaMaskE2EContext } = require('../../capabilities/factory');
    const context = createMetaMaskE2EContext();
    metaMaskSessionManager.setWorkflowContext(context);

    setKnowledgeStore(createKnowledgeStore());
    setSessionManager(metaMaskSessionManager);

    handlerRecord = buildToolHandlersRecord();

    setToolRegistry(handlerRecord);
    setToolValidator((tool, args) => {
      const validation = safeValidateToolInput(tool, args);
      if (validation.success) return { success: true };
      return { success: false, error: { message: validation.error } };
    });

    bootstrapped = true;
  }

  return { sessionManager: metaMaskSessionManager, callHandler };
}

async function bootstrapCdpSession(cdpPort) {
  const cdpSessionManager = await CdpSessionManager.connect(cdpPort);

  setKnowledgeStore(createKnowledgeStore());
  setSessionManager(cdpSessionManager);

  handlerRecord = buildToolHandlersRecord();

  setToolRegistry(handlerRecord);
  setToolValidator((tool, args) => {
    const validation = safeValidateToolInput(tool, args);
    if (validation.success) return { success: true };
    return { success: false, error: { message: validation.error } };
  });

  bootstrapped = true;

  return { sessionManager: cdpSessionManager, callHandler };
}

function getHandlerRecord() {
  if (!handlerRecord) throw new Error('Call bootstrapSession() first');
  return handlerRecord;
}

module.exports = {
  bootstrapSession,
  bootstrapCdpSession,
  callHandler,
  getHandlerRecord,
};
