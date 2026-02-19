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

export type PullRequestCommit = {
  sha: string;
  message: string;
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
  commits: PullRequestCommit[];
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

export type ScenariosBySource = {
  /** Scenarios that should be tested due to cherry-picks */
  cherryPickScenarios: TestingScenario[];
  /** Scenarios from analyzing all initial commits on the release branch */
  initialScenarios: TestingScenario[];
};

export type TestingPlan = {
  prNumber: number;
  prTitle: string;
  generatedAt: string;
  modelUsed: string;
  summary: {
    totalFilesChanged: number;
    totalCommits: number;
    /** Risk score 0-100 (higher = riskier) */
    riskScore: number;
    highRiskScenarios: number;
    mediumRiskScenarios: number;
  };
  testScenarios: ScenariosBySource;
};

export type LLMAnalysisRequest = {
  prInfo: PullRequestInfo;
  fileCategories: FileCategories;
};

export type LLMAnalysisResponse = {
  /** General release scenarios (from initial commits). Use when LLM returns flat structure. */
  scenarios: TestingScenario[];
  /** Scenarios specifically for cherry-pick changes. Optional - empty if no cherry-picks. */
  cherryPickScenarios?: TestingScenario[];
  summary: string;
};
