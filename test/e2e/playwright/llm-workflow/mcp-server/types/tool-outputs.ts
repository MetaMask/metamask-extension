import type { ExtensionState } from '../../types';
import type { TestIdItem, A11yNodeTrimmed } from './discovery';
import type { PriorKnowledgeV1 } from './knowledge';
import type { TabRole } from './tool-inputs';

export type BuildResult = {
  buildType: 'build:test';
  extensionPathResolved: string;
};

export type LaunchResult = {
  sessionId: string;
  extensionId: string;
  state: ExtensionState;
};

export type CleanupResult = {
  cleanedUp: boolean;
};

export type GetStateResult = {
  state: ExtensionState;
  tabs?: {
    active: TabInfo;
    tracked: TabInfo[];
  };
};

export type NavigateResult = {
  navigated: boolean;
  currentUrl: string;
};

export type WaitForNotificationResult = {
  found: boolean;
  pageUrl: string;
};

export type ListTestIdsResult = {
  items: TestIdItem[];
};

export type AccessibilitySnapshotResult = {
  nodes: A11yNodeTrimmed[];
};

export type ScreenshotInfo = {
  path: string;
  width: number;
  height: number;
  base64?: string | null;
} | null;

export type DescribeScreenResult = {
  state: ExtensionState;
  testIds: {
    items: TestIdItem[];
  };
  a11y: {
    nodes: A11yNodeTrimmed[];
  };
  screenshot: ScreenshotInfo;
  priorKnowledge?: PriorKnowledgeV1;
};

export type ScreenshotResult = {
  path: string;
  width: number;
  height: number;
  base64?: string;
};

export type ClickResult = {
  clicked: boolean;
  target: string;
  /**
   * True if the page closed after the click was dispatched.
   * This is a SUCCESS case - the click triggered the page to close
   * (e.g., clicking Confirm/Cancel on notification popups).
   */
  pageClosedAfterClick?: boolean;
};

export type TypeResult = {
  typed: boolean;
  target: string;
  textLength: number;
};

export type WaitForResult = {
  found: boolean;
  target: string;
};

export type StepResult = {
  tool: string;
  ok: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    durationMs: number;
    timestamp: string;
  };
};

export type RunStepsResult = {
  steps: StepResult[];
  summary: {
    ok: boolean;
    total: number;
    succeeded: number;
    failed: number;
    durationMs: number;
  };
};

export type TabInfo = {
  role: TabRole;
  url: string;
};

export type SwitchToTabResult = {
  switched: boolean;
  activeTab: TabInfo;
};

export type CloseTabResult = {
  closed: boolean;
  closedUrl: string;
};
