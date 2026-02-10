/**
 * Type definitions for the release testing plan generator
 */

export type PullRequestFile = {
  filename: string;
  additions: number;
  deletions: number;
  status?: 'added' | 'removed' | 'modified' | 'renamed';
  patch?: string;
};

export type PullRequestInfo = {
  number: number;
  title: string;
  body: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  files: PullRequestFile[];
  commitCount: number;
};

export type TestingScenario = {
  area: string;
  riskLevel: 'high' | 'medium' | 'low';
  testSteps: string[];
  whyThisMatters: string;
};

export type FileCategories = {
  controllers: string[];
  uiComponents: string[];
  migrations: string[];
  tests: string[];
  config: string[];
  other: string[];
};

export type TestingPlan = {
  prNumber: number;
  prTitle: string;
  generatedAt: string;
  modelUsed: string;
  summary: {
    totalFilesChanged: number;
    totalAdditions: number;
    totalDeletions: number;
    highRiskScenarios: number;
    mediumRiskScenarios: number;
  };
  scenarios: TestingScenario[];
};

export type LLMAnalysisRequest = {
  prInfo: PullRequestInfo;
  fileCategories: FileCategories;
};

export type LLMAnalysisResponse = {
  scenarios: TestingScenario[];
  summary: string;
};
