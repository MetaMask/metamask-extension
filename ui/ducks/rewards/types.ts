export enum OnboardingStep {
  INTRO = 'INTRO',
  STEP1 = 'STEP_1',
  STEP2 = 'STEP_2',
  STEP3 = 'STEP_3',
  STEP4 = 'STEP_4',
}

export type CandidateSubscriptionId =
  | 'pending'
  | 'retry'
  | 'error'
  | string
  | null;
