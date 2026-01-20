import type { McpResponse, HandlerOptions } from '../types';

import { handleBuild } from './build';
import { handleLaunch } from './launch';
import { handleCleanup } from './cleanup';
import { handleGetState } from './state';
import { handleNavigate, handleWaitForNotification } from './navigation';
import {
  handleListTestIds,
  handleAccessibilitySnapshot,
  handleDescribeScreen,
} from './discovery-tools';
import { handleClick, handleType, handleWaitFor } from './interaction';
import { handleScreenshot } from './screenshot';
import {
  handleKnowledgeLast,
  handleKnowledgeSearch,
  handleKnowledgeSummarize,
  handleKnowledgeSessions,
} from './knowledge';
import {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './seeding';
import { handleRunSteps } from './batch';

export type ToolHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  options?: HandlerOptions,
) => Promise<McpResponse<unknown>>;

/* eslint-disable @typescript-eslint/naming-convention */
export const toolHandlers: Record<string, ToolHandler> = {
  mm_build: handleBuild as ToolHandler,
  mm_launch: handleLaunch as ToolHandler,
  mm_cleanup: handleCleanup as ToolHandler,
  mm_get_state: ((_, options) => handleGetState(options)) as ToolHandler,
  mm_navigate: handleNavigate as ToolHandler,
  mm_wait_for_notification: handleWaitForNotification as ToolHandler,
  mm_list_testids: handleListTestIds as ToolHandler,
  mm_accessibility_snapshot: handleAccessibilitySnapshot as ToolHandler,
  mm_describe_screen: handleDescribeScreen as ToolHandler,
  mm_screenshot: handleScreenshot as ToolHandler,
  mm_click: handleClick as ToolHandler,
  mm_type: handleType as ToolHandler,
  mm_wait_for: handleWaitFor as ToolHandler,
  mm_knowledge_last: handleKnowledgeLast as ToolHandler,
  mm_knowledge_search: handleKnowledgeSearch as ToolHandler,
  mm_knowledge_summarize: handleKnowledgeSummarize as ToolHandler,
  mm_knowledge_sessions: handleKnowledgeSessions as ToolHandler,
  mm_seed_contract: handleSeedContract as ToolHandler,
  mm_seed_contracts: handleSeedContracts as ToolHandler,
  mm_get_contract_address: handleGetContractAddress as ToolHandler,
  mm_list_contracts: handleListDeployedContracts as ToolHandler,
  mm_run_steps: handleRunSteps as ToolHandler,
};
/* eslint-enable @typescript-eslint/naming-convention */

export function getToolHandler(name: string): ToolHandler | undefined {
  return toolHandlers[name];
}

export function hasToolHandler(name: string): boolean {
  return name in toolHandlers;
}
