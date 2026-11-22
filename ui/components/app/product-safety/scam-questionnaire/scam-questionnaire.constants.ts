export const TOTAL_QUESTIONS = 3;

export enum ScamQuestionnaireTrigger {
  SecurityAlert = 'security_alert',
  DomainList = 'domain_list',
}

// Bump when the questions, answer options, or red-flag verdicts change.
export const QUESTIONNAIRE_VERSION = '1';

// Steps 0-2 are the questions; the final index is the warning screen.
export type Step = 0 | 1 | 2 | 3;

export type StepLabel = 'q1' | 'q2' | 'q3' | 'warning';

export function stepLabelFromIndex(step: Step): StepLabel {
  if (step === 0) {
    return 'q1';
  }
  if (step === 1) {
    return 'q2';
  }
  if (step === 2) {
    return 'q3';
  }
  return 'warning';
}

// Seconds the bypass ("continue anyway") link stays disabled on the scam
// warning screen, forcing the user to pause and read the warning before they
// can dismiss it.
export const PROCEED_DELAY_SECONDS = 10;

export type QuestionId = 'q1' | 'q2' | 'q3';

export type QuestionOption = {
  key: string;
  isRedFlag: boolean;
  titleKey: string;
  subtitleKey?: string;
};

export const Q1_OPTIONS: QuestionOption[] = [
  {
    key: 'q1_yes',
    isRedFlag: true,
    titleKey: 'scamQuestionnaireQ1Yes',
  },
  {
    key: 'q1_no',
    isRedFlag: false,
    titleKey: 'scamQuestionnaireQ1No',
  },
];

export const Q2_OPTIONS: QuestionOption[] = [
  {
    key: 'q2_investment',
    isRedFlag: true,
    titleKey: 'scamQuestionnaireQ2InvestmentTitle',
    subtitleKey: 'scamQuestionnaireQ2InvestmentSubtitle',
  },
  {
    key: 'q2_helping',
    isRedFlag: true,
    titleKey: 'scamQuestionnaireQ2HelpingTitle',
    subtitleKey: 'scamQuestionnaireQ2HelpingSubtitle',
  },
  {
    key: 'q2_government',
    isRedFlag: true,
    titleKey: 'scamQuestionnaireQ2GovernmentTitle',
    subtitleKey: 'scamQuestionnaireQ2GovernmentSubtitle',
  },
  {
    key: 'q2_job',
    isRedFlag: true,
    titleKey: 'scamQuestionnaireQ2JobTitle',
    subtitleKey: 'scamQuestionnaireQ2JobSubtitle',
  },
  {
    key: 'q2_goods',
    isRedFlag: false,
    titleKey: 'scamQuestionnaireQ2GoodsTitle',
    subtitleKey: 'scamQuestionnaireQ2GoodsSubtitle',
  },
  {
    key: 'q2_self_transfer',
    isRedFlag: false,
    titleKey: 'scamQuestionnaireQ2SelfTransferTitle',
    subtitleKey: 'scamQuestionnaireQ2SelfTransferSubtitle',
  },
];

export const Q3_OPTIONS: QuestionOption[] = [
  {
    key: 'q3_yes',
    isRedFlag: true,
    titleKey: 'scamQuestionnaireQ3Yes',
  },
  {
    key: 'q3_no',
    isRedFlag: false,
    titleKey: 'scamQuestionnaireQ3No',
  },
];

export type Answers = Partial<Record<QuestionId, QuestionOption>>;

export function getRedFlagCount(answers: Answers): number {
  return (Object.values(answers) as QuestionOption[]).filter(
    (answer) => answer?.isRedFlag,
  ).length;
}

/* eslint-disable @typescript-eslint/naming-convention -- These keys are sent
   verbatim as analytics properties, which segment-schema requires in
   snake_case. */
export type AnswerRecord = {
  q1_answer: string | null;
  q2_answer: string | null;
  q3_answer: string | null;
};

// Unanswered questions report `null` rather than being omitted, so events
// distinguish "not reached" from "answered".
export function getAnswerRecord(answers: Answers): AnswerRecord {
  return {
    q1_answer: answers.q1?.key ?? null,
    q2_answer: answers.q2?.key ?? null,
    q3_answer: answers.q3?.key ?? null,
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

export function getRedFlagQuestions(answers: Answers): QuestionId[] {
  return (Object.entries(answers) as [QuestionId, QuestionOption][])
    .filter(([, answer]) => answer?.isRedFlag)
    .map(([question]) => question);
}
