import type { ExtensionState } from '../../types';
import type { TestIdItem, A11yNodeTrimmed } from './discovery';
import type { PriorKnowledgeV1 } from './knowledge';

export const FLOW_TAGS = [
  'send',
  'swap',
  'connect',
  'sign',
  'onboarding',
  'settings',
  'tx-confirmation',
] as const;

export type FlowTag = (typeof FLOW_TAGS)[number];

export const STEP_LABELS = [
  'discovery',
  'navigation',
  'interaction',
  'confirmation',
  'error-recovery',
] as const;

export type StepLabel = (typeof STEP_LABELS)[number];

export type StepRecordEnvironment = {
  platform?: string;
  nodeVersion?: string;
  yarnVersion?: string;
};

export type StepRecordGit = {
  branch?: string;
  commit?: string;
  dirty?: boolean;
};

export type StepRecordBuild = {
  buildType?: 'build:test';
  extensionPathResolved?: string;
};

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

export type StepRecordTiming = {
  durationMs?: number;
};

export type StepRecordOutcome = {
  ok: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

export type StepRecordObservation = {
  state: ExtensionState;
  testIds: TestIdItem[];
  a11y: {
    nodes: A11yNodeTrimmed[];
  };
  priorKnowledge?: PriorKnowledgeV1;
};

export type StepRecordArtifacts = {
  screenshot?: {
    path?: string;
    width?: number;
    height?: number;
  };
};

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
  labels?: string[];
};

export type SessionMetadata = {
  schemaVersion: 1;
  sessionId: string;
  createdAt: string;
  goal?: string;
  flowTags: string[];
  tags: string[];
  git?: StepRecordGit;
  build?: StepRecordBuild;
  launch: {
    stateMode: 'default' | 'onboarding' | 'custom';
    fixturePreset?: string | null;
    extensionPath?: string;
    ports?: {
      anvil?: number;
      fixtureServer?: number;
    };
  };
};
