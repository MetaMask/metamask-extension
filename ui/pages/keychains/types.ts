/**
 * Screen identifiers for the reveal seed flow.
 */
export type RevealSeedScreen =
  | 'QUIZ_INTRODUCTION_SCREEN'
  | 'QUIZ_QUESTIONS_SCREEN'
  | 'PASSWORD_PROMPT_SCREEN'
  | 'REVEAL_SEED_SCREEN';

/**
 * Location state when navigating to reveal seed page (e.g. skip quiz).
 */
export interface RevealSeedLocationState {
  skipQuiz?: boolean;
}

/**
 * Route params for keychains (e.g. keyring ID for multi-SRP).
 */
export interface KeychainsParams {
  keyringId?: string;
}

/**
 * Single quiz question configuration.
 */
export interface QuizQuestionConfig {
  question: string;
  buttonLabelOne: string;
  buttonLabelTwo: string;
  questionDataTestId: string;
}

/**
 * Correct/wrong answer content for a quiz question.
 */
export interface QuizAnswerContent {
  title: string;
  description: string;
}

/**
 * Answered quiz question feedback (correct and wrong).
 */
export interface AnsweredQuizQuestion {
  correct: QuizAnswerContent;
  wrong: QuizAnswerContent;
}
