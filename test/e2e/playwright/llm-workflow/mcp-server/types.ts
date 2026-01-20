/**
 * MCP Server Types - Public API
 *
 * This file re-exports all types and utilities for the MCP server.
 * Import from this file for stable API access.
 *
 * Internal organization:
 * - Type definitions: ./types/
 * - Runtime utilities: ./utils/
 */

import type { ExtensionState, ScreenName } from '../types';

// Re-export extension types for convenience
export type { ExtensionState, ScreenName };

// Re-export schema utilities
export {
  toolSchemas,
  validateToolInput,
  safeValidateToolInput,
  type ToolName,
} from './schemas';

// =============================================================================
// Types (from ./types/)
// =============================================================================

export type {
  ResponseMeta,
  SuccessResponse,
  ErrorDetails,
  ErrorResponse,
  McpResponse,
} from './types/responses';

export { ErrorCodes, type ErrorCode } from './types/errors';

export {
  SMART_CONTRACT_NAMES,
  HARDFORKS,
  type SmartContractName,
  type Hardfork,
  type SeedContractInput,
  type SeedContractsInput,
  type GetContractAddressInput,
  type ListDeployedContractsInput,
  type SeedContractResult,
  type SeedContractsResult,
  type GetContractAddressResult,
  type ListDeployedContractsResult,
} from './types/seeding';

export type {
  HandlerOptions,
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
  KnowledgeScope,
  KnowledgeFilters,
  KnowledgeLastInput,
  KnowledgeSearchInput,
  KnowledgeSummarizeInput,
  KnowledgeSessionsInput,
  RunStepsInput,
} from './types/tool-inputs';

export type {
  BuildResult,
  LaunchResult,
  CleanupResult,
  GetStateResult,
  NavigateResult,
  WaitForNotificationResult,
  ListTestIdsResult,
  AccessibilitySnapshotResult,
  ScreenshotInfo,
  DescribeScreenResult,
  ScreenshotResult,
  ClickResult,
  TypeResult,
  WaitForResult,
  StepResult,
  RunStepsResult,
} from './types/tool-outputs';

export type {
  PriorKnowledgeTarget,
  PriorKnowledgeSuggestedAction,
  PriorKnowledgeSimilarStep,
  PriorKnowledgeAvoid,
  PriorKnowledgeRelatedSession,
  PriorKnowledgeQuery,
  PriorKnowledgeV1,
  PriorKnowledgeContext,
  KnowledgeStepSummary,
  KnowledgeLastResult,
  KnowledgeSearchResult,
  RecipeStep,
  KnowledgeSummarizeResult,
  SessionSummary,
  KnowledgeSessionsResult,
} from './types/knowledge';

export {
  FLOW_TAGS,
  STEP_LABELS,
  type FlowTag,
  type StepLabel,
  type StepRecordEnvironment,
  type StepRecordGit,
  type StepRecordBuild,
  type StepRecordTool,
  type StepRecordTiming,
  type StepRecordOutcome,
  type StepRecordObservation,
  type StepRecordArtifacts,
  type StepRecord,
  type SessionMetadata,
} from './types/step-record';

export {
  ACTIONABLE_ROLES,
  IMPORTANT_ROLES,
  INCLUDED_ROLES,
  type ActionableRole,
  type ImportantRole,
  type IncludedRole,
  type TestIdItem,
  type A11yNodeTrimmed,
  type RawA11yNode,
} from './types/discovery';

export type { SessionState } from './types/session';

// =============================================================================
// Runtime Utilities (from ./utils/)
// =============================================================================

export { createSuccessResponse, createErrorResponse } from './utils/response';

export { SENSITIVE_FIELD_PATTERNS, isSensitiveField } from './utils/redaction';

export {
  validateTargetSelection,
  type TargetValidationResult,
} from './utils/targets';

export { generateFilesafeTimestamp, generateSessionId } from './utils/time';
