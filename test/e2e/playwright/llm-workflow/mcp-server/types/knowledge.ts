import type { ScreenName } from '../../types';
import type { TestIdItem, A11yNodeTrimmed } from './discovery';

export type PriorKnowledgeTarget =
  | { type: 'testId'; value: string }
  | { type: 'selector'; value: string }
  | { type: 'a11yHint'; value: { role: string; name: string } };

export type PriorKnowledgeSuggestedAction = {
  rank: number;
  action: 'click' | 'type' | 'wait_for' | 'navigate' | 'wait_for_notification';
  rationale: string;
  confidence: number;
  preferredTarget: PriorKnowledgeTarget;
  fallbackTargets?: PriorKnowledgeTarget[];
};

export type PriorKnowledgeSimilarStep = {
  sessionId: string;
  timestamp: string;
  tool: string;
  screen: string;
  snippet: string;
  labels?: string[];
  target?: { testId?: string; selector?: string };
  a11yHint?: { role: string; name: string };
  confidence: number;
};

export type PriorKnowledgeAvoid = {
  rationale: string;
  target: { selector?: string; testId?: string };
  errorCode?: string;
  frequency: number;
};

export type PriorKnowledgeRelatedSession = {
  sessionId: string;
  createdAt: string;
  goal?: string;
  flowTags: string[];
  tags: string[];
  git?: { branch?: string; commit?: string };
};

export type PriorKnowledgeQuery = {
  windowHours: number;
  usedFlowTags: string[];
  usedFilters: Record<string, unknown>;
  candidateSessions: number;
  candidateSteps: number;
};

export type PriorKnowledgeV1 = {
  schemaVersion: 1;
  generatedAt: string;
  query: PriorKnowledgeQuery;
  relatedSessions: PriorKnowledgeRelatedSession[];
  similarSteps: PriorKnowledgeSimilarStep[];
  suggestedNextActions: PriorKnowledgeSuggestedAction[];
  avoid?: PriorKnowledgeAvoid[];
};

export type PriorKnowledgeContext = {
  currentScreen: string;
  currentUrl?: string;
  visibleTestIds: TestIdItem[];
  a11yNodes: A11yNodeTrimmed[];
  currentSessionFlowTags?: string[];
};

export type KnowledgeStepSummary = {
  timestamp: string;
  tool: string;
  screen: ScreenName;
  snippet: string;
  sessionId?: string;
  matchedFields?: string[];
  sessionGoal?: string;
};

export type KnowledgeLastResult = {
  steps: KnowledgeStepSummary[];
};

export type KnowledgeSearchResult = {
  matches: KnowledgeStepSummary[];
  query: string;
};

export type RecipeStep = {
  stepNumber: number;
  tool: string;
  notes: string;
};

export type KnowledgeSummarizeResult = {
  sessionId: string;
  stepCount: number;
  recipe: RecipeStep[];
};

export type SessionSummary = {
  sessionId: string;
  createdAt: string;
  goal?: string;
  flowTags: string[];
  tags: string[];
  git?: {
    branch?: string;
    commit?: string;
  };
};

export type KnowledgeSessionsResult = {
  sessions: SessionSummary[];
};
