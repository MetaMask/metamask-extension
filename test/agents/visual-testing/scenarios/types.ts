export type ScenarioStateMode = 'default' | 'onboarding' | 'custom';

export type ScenarioAssertion = {
  type: 'account-renamed';
  expectedName: string;
};

export type Scenario = {
  name: string;
  description: string;
  stateMode: ScenarioStateMode;
  statePreset?: string;
  taskPrompt: string;
  targetName: string;
  assertion: ScenarioAssertion;
  disallowedBashPatterns: string[];
};

export type ScenarioFactory = (trialIndex: number) => Scenario;
