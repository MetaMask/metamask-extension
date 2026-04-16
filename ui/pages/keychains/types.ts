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
export type RevealSeedLocationState = {
  skipQuiz?: boolean;
};

/**
 * Single quiz question configuration.
 */
export type QuizQuestionConfig = {
  question: string;
  buttonLabelOne: string;
  buttonLabelTwo: string;
  questionDataTestId: string;
};

/**
 * Correct/wrong answer content for a quiz question.
 */
export type QuizAnswerContent = {
  title: string;
  description: string;
};

/**
 * Answered quiz question feedback (correct and wrong).
 */
export type AnsweredQuizQuestion = {
  correct: QuizAnswerContent;
  wrong: QuizAnswerContent;
};
