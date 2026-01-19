import type { ExtensionState } from '../../types';
import type { TestIdItem, A11yNodeTrimmed } from './discovery';
import type { PriorKnowledgeV1 } from './knowledge';

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
