export const TOTAL_QUESTIONS = 3;

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

export function getRedFlagQuestions(answers: Answers): QuestionId[] {
  return (Object.entries(answers) as [QuestionId, QuestionOption][])
    .filter(([, answer]) => answer?.isRedFlag)
    .map(([question]) => question);
}
