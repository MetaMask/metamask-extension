/**
 * Bootstrap session manager + tool handler registry.
 * Mirrors the initialization pattern from mcp-server/server.ts.
 */

/* eslint-disable import-x/extensions */
import {
  setSessionManager,
  setKnowledgeStore,
  createKnowledgeStore,
  buildToolHandlersRecord,
  setToolRegistry,
  setToolValidator,
  safeValidateToolInput,
  type ISessionManager,
  type WorkflowContext,
  type McpResponse,
  type ToolHandler,
} from '@metamask/client-mcp-core';
/* eslint-enable import-x/extensions */
import { createMetaMaskE2EContext } from '../../capabilities/factory';
import { metaMaskSessionManager } from '../../mcp-server/metamask-provider';
import { CdpSessionManager } from './cdp-session-manager';

export type BootstrapResult = {
  sessionManager: ISessionManager;
  callHandler: (
    toolName: string,
    input: Record<string, unknown>,
  ) => Promise<McpResponse<unknown>>;
};

let bootstrapped = false;
let handlerRecord: Record<string, ToolHandler> | null = null;

/**
 * Initialize the session manager, knowledge store, and tool registry.
 * Idempotent — safe to call multiple times.
 */
export function bootstrapSession(): BootstrapResult {
  if (!bootstrapped) {
    const context: WorkflowContext = createMetaMaskE2EContext();
    metaMaskSessionManager.setWorkflowContext(context);

    setKnowledgeStore(createKnowledgeStore());
    setSessionManager(metaMaskSessionManager);

    handlerRecord = buildToolHandlersRecord();

    // Wire up the tool registry so handleRunSteps can dispatch
    setToolRegistry(handlerRecord);
    setToolValidator((tool: string, args: Record<string, unknown>) => {
      const validation = safeValidateToolInput(tool, args);
      if (validation.success) {
        return { success: true as const };
      }
      return { success: false as const, error: { message: validation.error } };
    });

    bootstrapped = true;
  }

  return {
    sessionManager: metaMaskSessionManager,
    callHandler,
  };
}

/**
 * Bootstrap session manager using an existing browser via CDP.
 * Connects to a Chrome instance on the given port and wires up all tool handlers.
 */
export async function bootstrapCdpSession(
  cdpPort: number,
): Promise<BootstrapResult> {
  const cdpSessionManager = await CdpSessionManager.connect(cdpPort);

  setKnowledgeStore(createKnowledgeStore());
  setSessionManager(cdpSessionManager);

  handlerRecord = buildToolHandlersRecord();

  setToolRegistry(handlerRecord);
  setToolValidator((tool: string, args: Record<string, unknown>) => {
    const validation = safeValidateToolInput(tool, args);
    if (validation.success) {
      return { success: true as const };
    }
    return { success: false as const, error: { message: validation.error } };
  });

  // Mark as bootstrapped so normal bootstrapSession() won't re-init
  bootstrapped = true;

  return {
    sessionManager: cdpSessionManager,
    callHandler,
  };
}

/**
 * Normalize a tool name to include the mm_ prefix.
 * @param name
 */
function normalizeName(name: string): string {
  return name.startsWith('mm_') ? name : `mm_${name}`;
}

/**
 * Call a tool handler by name with the given input.
 * @param toolName
 * @param input
 */
async function callHandler(
  toolName: string,
  input: Record<string, unknown>,
): Promise<McpResponse<unknown>> {
  if (!handlerRecord) {
    throw new Error('Call bootstrapSession() before calling handlers');
  }

  const prefixed = normalizeName(toolName);
  const handler = handlerRecord[prefixed];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName} (looked up as ${prefixed})`);
  }

  return handler(input);
}

/**
 * Get the raw handler record (for batch execution via handleRunSteps).
 */
export function getHandlerRecord(): Record<string, ToolHandler> {
  if (!handlerRecord) {
    throw new Error('Call bootstrapSession() first');
  }
  return handlerRecord;
}
