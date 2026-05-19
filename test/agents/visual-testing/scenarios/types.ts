export type ScenarioStateMode = 'default' | 'onboarding' | 'custom';

export type ScenarioDifficulty = 'easy' | 'medium' | 'hard';

export type ScenarioAssertion =
  | { type: 'account-renamed'; expectedName: string }
  | { type: 'screen-contains'; text: string }
  | { type: 'network-switched'; expectedNetwork: string }

export type Scenario = {
  name: string;
  description: string;
  difficulty: ScenarioDifficulty;
  stateMode: ScenarioStateMode;
  statePreset?: string;
  taskPrompt: string;
  targetName?: string;
  assertion: ScenarioAssertion;
  disallowedBashPatterns: string[];
  beforeAgent?: (cwd: string) => ScenarioSetupResult | Promise<ScenarioSetupResult> | void | Promise<void>;
};

export type ScenarioSetupResult = {
  taskPromptOverride?: string;
  assertionOverride?: ScenarioAssertion;
};

export type ScenarioFactory = (
  trialIndex: number,
) => Scenario | Promise<Scenario>;
