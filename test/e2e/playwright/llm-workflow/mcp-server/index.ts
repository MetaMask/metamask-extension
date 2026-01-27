/**
 * MetaMask MCP Server - Module Exports
 *
 * This module provides an MCP (Model Context Protocol) server for LLM agents
 * to build, launch, interact with, and visually validate the MetaMask Extension
 * in a real headed Chrome browser.
 */

// =============================================================================
// Types
// =============================================================================
export type {
  // Response envelopes
  ResponseMeta,
  SuccessResponse,
  ErrorDetails,
  ErrorResponse,
  McpResponse,
  // Tool inputs
  BuildInput,
  LaunchInput,
  CleanupInput,
  NavigateInput,
  WaitForNotificationInput,
  ListTestIdsInput,
  AccessibilitySnapshotInput,
  DescribeScreenInput,
  ScreenshotInput,
  TargetSelection,
  ClickInput,
  TypeInput,
  WaitForInput,
  KnowledgeLastInput,
  KnowledgeSearchInput,
  KnowledgeSummarizeInput,
  KnowledgeSessionsInput,
  KnowledgeScope,
  KnowledgeFilters,
  // Tool outputs
  BuildResult,
  LaunchResult,
  CleanupResult,
  GetStateResult,
  NavigateResult,
  WaitForNotificationResult,
  TestIdItem,
  ListTestIdsResult,
  A11yNodeTrimmed,
  AccessibilitySnapshotResult,
  ScreenshotInfo,
  DescribeScreenResult,
  ScreenshotResult,
  ClickResult,
  TypeResult,
  WaitForResult,
  KnowledgeStepSummary,
  KnowledgeLastResult,
  KnowledgeSearchResult,
  RecipeStep,
  KnowledgeSummarizeResult,
  SessionSummary,
  KnowledgeSessionsResult,
  // StepRecord types
  StepRecordEnvironment,
  StepRecordGit,
  StepRecordBuild,
  StepRecordTool,
  StepRecordTiming,
  StepRecordOutcome,
  StepRecordObservation,
  StepRecordArtifacts,
  StepRecord,
  // Session metadata types
  SessionMetadata,
  FlowTag,
  StepLabel,
  // Discovery types
  ActionableRole,
  ImportantRole,
  IncludedRole,
  RawA11yNode,
  // Session types
  SessionState,
  // Error types
  ErrorCode,
  // Seeding types
  SmartContractName,
  Hardfork,
  SeedContractInput,
  SeedContractsInput,
  GetContractAddressInput,
  ListDeployedContractsInput,
  SeedContractResult,
  SeedContractsResult,
  GetContractAddressResult,
  ListDeployedContractsResult,
} from './types';

// =============================================================================
// Constants
// =============================================================================
export {
  ErrorCodes,
  ACTIONABLE_ROLES,
  IMPORTANT_ROLES,
  INCLUDED_ROLES,
  SENSITIVE_FIELD_PATTERNS,
  FLOW_TAGS,
  STEP_LABELS,
  SMART_CONTRACT_NAMES,
} from './types';

// =============================================================================
// Utility Functions
// =============================================================================
export {
  createSuccessResponse,
  createErrorResponse,
  validateTargetSelection,
  isSensitiveField,
  generateFilesafeTimestamp,
  generateSessionId,
} from './types';

// =============================================================================
// Session Management
// =============================================================================
export { sessionManager, SessionManager } from './session-manager';

// =============================================================================
// Knowledge Store
// =============================================================================
export { knowledgeStore, KnowledgeStore } from './knowledge-store';

// =============================================================================
// Discovery
// =============================================================================
export {
  collectTestIds,
  collectTrimmedA11ySnapshot,
  resolveTarget,
  waitForTarget,
} from './discovery';

// =============================================================================
// Tool Handlers
// =============================================================================
export { handleBuild } from './tools/build';
export { handleLaunch } from './tools/launch';
export { handleCleanup } from './tools/cleanup';
export { handleGetState } from './tools/state';
export { handleNavigate, handleWaitForNotification } from './tools/navigation';
export {
  handleListTestIds,
  handleAccessibilitySnapshot,
  handleDescribeScreen,
} from './tools/discovery-tools';
export { handleClick, handleType, handleWaitFor } from './tools/interaction';
export { handleScreenshot } from './tools/screenshot';
export {
  handleKnowledgeLast,
  handleKnowledgeSearch,
  handleKnowledgeSummarize,
  handleKnowledgeSessions,
} from './tools/knowledge';
export {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './tools/seeding';
