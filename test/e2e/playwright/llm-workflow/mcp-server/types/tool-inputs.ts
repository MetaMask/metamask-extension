import type { SmartContractName } from './seeding';

/**
 * Tab role classification for multi-tab management
 */
export type TabRole = 'extension' | 'notification' | 'dapp' | 'other';

/**
 * Observation policy for tool execution.
 * - 'default': Full observation (state + testIds + a11y) - current behavior
 * - 'none': Minimal observation (state only) - fastest
 * - 'failures': Minimal on success, full on failure - balanced
 */
export type ObservationPolicyOverride = 'default' | 'none' | 'failures';

export type HandlerOptions = {
  signal?: AbortSignal;
  /**
   * Override observation policy for this tool execution.
   * Used by mm_run_steps to propagate includeObservations setting.
   */
  observationPolicy?: ObservationPolicyOverride;
};

export type BuildInput = {
  buildType?: 'build:test';
  force?: boolean;
};

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
  goal?: string;
  flowTags?: string[];
  tags?: string[];
  seedContracts?: SmartContractName[];
};

export type CleanupInput = {
  sessionId?: string;
};

export type NavigateInput = {
  screen: 'home' | 'settings' | 'notification' | 'url';
  url?: string;
};

export type WaitForNotificationInput = {
  timeoutMs?: number;
};

export type ListTestIdsInput = {
  limit?: number;
};

export type AccessibilitySnapshotInput = {
  rootSelector?: string;
};

export type DescribeScreenInput = {
  includeScreenshot?: boolean;
  screenshotName?: string;
  includeScreenshotBase64?: boolean;
};

export type ScreenshotInput = {
  name: string;
  fullPage?: boolean;
  selector?: string;
  includeBase64?: boolean;
};

export type TargetSelection = {
  a11yRef?: string;
  testId?: string;
  selector?: string;
};

export type ClickInput = TargetSelection & {
  timeoutMs?: number;
};

export type TypeInput = TargetSelection & {
  text: string;
  timeoutMs?: number;
};

export type WaitForInput = TargetSelection & {
  timeoutMs?: number;
};

export type KnowledgeScope = 'current' | 'all' | { sessionId: string };

export type KnowledgeFilters = {
  flowTag?: string;
  tag?: string;
  screen?: string;
  sinceHours?: number;
  gitBranch?: string;
};

export type KnowledgeLastInput = {
  n?: number;
  scope?: KnowledgeScope;
  filters?: KnowledgeFilters;
};

export type KnowledgeSearchInput = {
  query: string;
  limit?: number;
  scope?: KnowledgeScope;
  filters?: KnowledgeFilters;
};

export type KnowledgeSummarizeInput = {
  sessionId?: string;
  scope?: KnowledgeScope;
};

export type KnowledgeSessionsInput = {
  limit?: number;
  filters?: KnowledgeFilters;
};

export type RunStepsInput = {
  steps: {
    tool: string;
    args?: Record<string, unknown>;
  }[];
  stopOnError?: boolean;
  includeObservations?: 'none' | 'failures' | 'all';
};

export type SwitchToTabInput = {
  role?: TabRole;
  url?: string;
};

export type CloseTabInput = {
  role?: 'notification' | 'dapp' | 'other';
  url?: string;
};
