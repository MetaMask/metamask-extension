/**
 * MCP Server Types for MetaMask Visual Testing
 *
 * This file defines all types for the MCP server including:
 * - Response envelopes (success/error)
 * - Tool input/output schemas
 * - StepRecord schema for knowledge store
 * - Discovery types for accessibility and testId inventory
 */

import type { ExtensionState, ScreenName } from '../types';

// =============================================================================
// Response Envelopes
// =============================================================================

/**
 * Metadata included in all MCP tool responses
 */
export type ResponseMeta = {
  timestamp: string;
  sessionId?: string;
  durationMs: number;
};

/**
 * Success response envelope
 */
export type SuccessResponse<T = unknown> = {
  meta: ResponseMeta;
  ok: true;
  result: T;
};

/**
 * Error details in error response
 */
export type ErrorDetails = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

/**
 * Error response envelope
 */
export type ErrorResponse = {
  error: ErrorDetails;
  meta: ResponseMeta;
  ok: false;
};

/**
 * Union type for all MCP responses
 */
export type McpResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// =============================================================================
// Error Codes
// =============================================================================

export const ErrorCodes = {
  // Build errors
  MM_BUILD_FAILED: 'MM_BUILD_FAILED',
  MM_DEPENDENCIES_MISSING: 'MM_DEPENDENCIES_MISSING',

  // Session errors
  MM_SESSION_ALREADY_RUNNING: 'MM_SESSION_ALREADY_RUNNING',
  MM_NO_ACTIVE_SESSION: 'MM_NO_ACTIVE_SESSION',
  MM_LAUNCH_FAILED: 'MM_LAUNCH_FAILED',

  // Configuration errors
  MM_INVALID_CONFIG: 'MM_INVALID_CONFIG',
  MM_INVALID_INPUT: 'MM_INVALID_INPUT',
  MM_PORT_IN_USE: 'MM_PORT_IN_USE',

  // Navigation errors
  MM_NAVIGATION_FAILED: 'MM_NAVIGATION_FAILED',
  MM_NOTIFICATION_TIMEOUT: 'MM_NOTIFICATION_TIMEOUT',

  // Interaction errors
  MM_TARGET_NOT_FOUND: 'MM_TARGET_NOT_FOUND',
  MM_CLICK_FAILED: 'MM_CLICK_FAILED',
  MM_TYPE_FAILED: 'MM_TYPE_FAILED',
  MM_WAIT_TIMEOUT: 'MM_WAIT_TIMEOUT',

  // Screenshot errors
  MM_SCREENSHOT_FAILED: 'MM_SCREENSHOT_FAILED',

  // Knowledge store errors
  MM_KNOWLEDGE_ERROR: 'MM_KNOWLEDGE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// Tool Input Types
// =============================================================================

/**
 * mm_build input
 */
export type BuildInput = {
  buildType?: 'build:test';
  force?: boolean;
};

/**
 * mm_launch input
 */
export type LaunchInput = {
  autoBuild?: boolean;
  stateMode?: 'default' | 'onboarding' | 'custom';
  fixturePreset?: string;
  fixture?: Record<string, unknown>;
  ports?: {
    anvil?: number;
    fixtureServer?: number;
  };
  slowMo?: number;
  extensionPath?: string;
};

/**
 * mm_cleanup input
 */
export type CleanupInput = {
  sessionId?: string;
};

/**
 * mm_navigate input
 */
export type NavigateInput = {
  screen: 'home' | 'settings' | 'notification' | 'url';
  url?: string;
};

/**
 * mm_wait_for_notification input
 */
export type WaitForNotificationInput = {
  timeoutMs?: number;
};

/**
 * mm_list_testids input
 */
export type ListTestIdsInput = {
  limit?: number;
};

/**
 * mm_accessibility_snapshot input
 */
export type AccessibilitySnapshotInput = {
  rootSelector?: string;
};

/**
 * mm_describe_screen input
 */
export type DescribeScreenInput = {
  includeScreenshot?: boolean;
  screenshotName?: string;
  includeScreenshotBase64?: boolean;
};

/**
 * mm_screenshot input
 */
export type ScreenshotInput = {
  name: string;
  fullPage?: boolean;
  selector?: string;
  includeBase64?: boolean;
};

/**
 * Target selection for interaction tools
 * Exactly one of a11yRef, testId, or selector must be provided
 */
export type TargetSelection = {
  a11yRef?: string;
  testId?: string;
  selector?: string;
};

/**
 * mm_click input
 */
export type ClickInput = TargetSelection & {
  timeoutMs?: number;
};

/**
 * mm_type input
 */
export type TypeInput = TargetSelection & {
  text: string;
  timeoutMs?: number;
};

/**
 * mm_wait_for input
 */
export type WaitForInput = TargetSelection & {
  timeoutMs?: number;
};

/**
 * mm_knowledge_last input
 */
export type KnowledgeLastInput = {
  n?: number;
};

/**
 * mm_knowledge_search input
 */
export type KnowledgeSearchInput = {
  query: string;
  limit?: number;
};

/**
 * mm_knowledge_summarize input
 */
export type KnowledgeSummarizeInput = {
  sessionId?: string;
};

// =============================================================================
// Tool Output Types
// =============================================================================

/**
 * mm_build result
 */
export type BuildResult = {
  buildType: 'build:test';
  extensionPathResolved: string;
};

/**
 * mm_launch result
 */
export type LaunchResult = {
  sessionId: string;
  extensionId: string;
  state: ExtensionState;
};

/**
 * mm_cleanup result
 */
export type CleanupResult = {
  cleanedUp: boolean;
};

/**
 * mm_get_state result
 */
export type GetStateResult = {
  state: ExtensionState;
};

/**
 * mm_navigate result
 */
export type NavigateResult = {
  navigated: boolean;
  currentUrl: string;
};

/**
 * mm_wait_for_notification result
 */
export type WaitForNotificationResult = {
  found: boolean;
  pageUrl: string;
};

/**
 * TestId item for discovery
 */
export type TestIdItem = {
  testId: string;
  tag: string;
  text?: string;
  visible: boolean;
};

/**
 * mm_list_testids result
 */
export type ListTestIdsResult = {
  items: TestIdItem[];
};

/**
 * Trimmed accessibility node
 */
export type A11yNodeTrimmed = {
  ref: string;
  role: string;
  name: string;
  disabled?: boolean;
  checked?: boolean;
  expanded?: boolean;
  path: string[];
};

/**
 * mm_accessibility_snapshot result
 */
export type AccessibilitySnapshotResult = {
  nodes: A11yNodeTrimmed[];
};

/**
 * Screenshot info in results
 */
export type ScreenshotInfo = {
  path: string;
  width: number;
  height: number;
  base64?: string | null;
} | null;

/**
 * mm_describe_screen result
 */
export type DescribeScreenResult = {
  state: ExtensionState;
  testIds: {
    items: TestIdItem[];
  };
  a11y: {
    nodes: A11yNodeTrimmed[];
  };
  screenshot: ScreenshotInfo;
};

/**
 * mm_screenshot result
 */
export type ScreenshotResult = {
  path: string;
  width: number;
  height: number;
  base64?: string;
};

/**
 * mm_click result
 */
export type ClickResult = {
  clicked: boolean;
  target: string;
};

/**
 * mm_type result
 */
export type TypeResult = {
  typed: boolean;
  target: string;
  textLength: number;
};

/**
 * mm_wait_for result
 */
export type WaitForResult = {
  found: boolean;
  target: string;
};

/**
 * Knowledge step summary for mm_knowledge_last
 */
export type KnowledgeStepSummary = {
  timestamp: string;
  tool: string;
  screen: ScreenName;
  snippet: string;
};

/**
 * mm_knowledge_last result
 */
export type KnowledgeLastResult = {
  steps: KnowledgeStepSummary[];
};

/**
 * mm_knowledge_search result
 */
export type KnowledgeSearchResult = {
  matches: KnowledgeStepSummary[];
  query: string;
};

/**
 * Recipe step for mm_knowledge_summarize
 */
export type RecipeStep = {
  stepNumber: number;
  tool: string;
  notes: string;
};

/**
 * mm_knowledge_summarize result
 */
export type KnowledgeSummarizeResult = {
  sessionId: string;
  stepCount: number;
  recipe: RecipeStep[];
};

// =============================================================================
// StepRecord Schema (v1)
// =============================================================================

/**
 * Environment information in StepRecord
 */
export type StepRecordEnvironment = {
  platform?: string;
  nodeVersion?: string;
  yarnVersion?: string;
};

/**
 * Git information in StepRecord
 */
export type StepRecordGit = {
  branch?: string;
  commit?: string;
  dirty?: boolean;
};

/**
 * Build information in StepRecord
 */
export type StepRecordBuild = {
  buildType?: 'build:test';
  extensionPathResolved?: string;
};

/**
 * Tool information in StepRecord
 */
export type StepRecordTool = {
  name: string;
  input?: Record<string, unknown>;
  target?: {
    selector?: string;
    testId?: string;
    a11yRef?: string;
  };
  textRedacted?: boolean;
  textLength?: number;
};

/**
 * Timing information in StepRecord
 */
export type StepRecordTiming = {
  durationMs?: number;
};

/**
 * Outcome information in StepRecord
 */
export type StepRecordOutcome = {
  ok: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

/**
 * Observation data in StepRecord
 */
export type StepRecordObservation = {
  state: ExtensionState;
  testIds: TestIdItem[];
  a11y: {
    nodes: A11yNodeTrimmed[];
  };
};

/**
 * Artifacts in StepRecord
 */
export type StepRecordArtifacts = {
  screenshot?: {
    path?: string;
    width?: number;
    height?: number;
  };
};

/**
 * Complete StepRecord schema v1
 */
export type StepRecord = {
  schemaVersion: 1;
  timestamp: string;
  sessionId: string;
  environment?: StepRecordEnvironment;
  git?: StepRecordGit;
  build?: StepRecordBuild;
  tool: StepRecordTool;
  timing?: StepRecordTiming;
  outcome: StepRecordOutcome;
  observation: StepRecordObservation;
  artifacts?: StepRecordArtifacts;
};

// =============================================================================
// Discovery Types
// =============================================================================

/**
 * Actionable and important roles for accessibility trimming
 */
export const ACTIONABLE_ROLES = [
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'textbox',
  'combobox',
  'menuitem',
] as const;

export const IMPORTANT_ROLES = [
  'dialog',
  'alert',
  'status',
  'heading',
] as const;

export const INCLUDED_ROLES = [
  ...ACTIONABLE_ROLES,
  ...IMPORTANT_ROLES,
] as const;

export type ActionableRole = (typeof ACTIONABLE_ROLES)[number];
export type ImportantRole = (typeof IMPORTANT_ROLES)[number];
export type IncludedRole = (typeof INCLUDED_ROLES)[number];

/**
 * Raw accessibility node from Playwright
 */
export type RawA11yNode = {
  role: string;
  name?: string;
  disabled?: boolean;
  checked?: boolean | 'mixed';
  expanded?: boolean;
  children?: RawA11yNode[];
};

// =============================================================================
// Session Types
// =============================================================================

/**
 * Session state tracked by SessionManager
 */
export type SessionState = {
  sessionId: string;
  extensionId: string;
  startedAt: string;
  ports: {
    anvil: number;
    fixtureServer: number;
  };
  stateMode: 'default' | 'onboarding' | 'custom';
};

/**
 * Sensitive field patterns for text sanitization
 */
export const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /seed/i,
  /srp/i,
  /phrase/i,
  /mnemonic/i,
  /private.*key/i,
  /secret/i,
] as const;

/**
 * Check if a field name matches sensitive patterns
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Helper to create a success response
 */
export function createSuccessResponse<T>(
  result: T,
  sessionId?: string,
  startTime?: number,
): SuccessResponse<T> {
  return {
    meta: {
      timestamp: new Date().toISOString(),
      sessionId,
      durationMs: startTime ? Date.now() - startTime : 0,
    },
    ok: true,
    result,
  };
}

/**
 * Helper to create an error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  sessionId?: string,
  startTime?: number,
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      sessionId,
      durationMs: startTime ? Date.now() - startTime : 0,
    },
    ok: false,
  };
}

/**
 * Validate target selection - exactly one must be provided
 */
export function validateTargetSelection(
  target: TargetSelection,
):
  | { valid: true; type: 'a11yRef' | 'testId' | 'selector'; value: string }
  | { valid: false; error: string } {
  const provided = [
    target.a11yRef ? 'a11yRef' : null,
    target.testId ? 'testId' : null,
    target.selector ? 'selector' : null,
  ].filter(Boolean) as ('a11yRef' | 'testId' | 'selector')[];

  if (provided.length === 0) {
    return {
      valid: false,
      error: 'Exactly one of a11yRef, testId, or selector must be provided',
    };
  }

  if (provided.length > 1) {
    return {
      valid: false,
      error: `Multiple targets provided (${provided.join(', ')}). Exactly one must be specified.`,
    };
  }

  const type = provided[0];
  const value = target[type] as string;

  return { valid: true, type, value };
}

/**
 * Generate filesystem-safe timestamp
 * Format: 20260115T123456.789Z
 */
export function generateFilesafeTimestamp(date: Date = new Date()): string {
  return date
    .toISOString()
    .replace(/[-:]/gu, '')
    .replace(
      /\.\d{3}Z$/u,
      `.${String(date.getMilliseconds()).padStart(3, '0')}Z`,
    );
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mm-${timestamp}-${random}`;
}
