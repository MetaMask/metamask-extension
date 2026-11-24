export type MoneyFaqDefinition = {
  id: string;
  questionKey: string;
  answerKey: string;
  usesApy?: boolean;
  substitutions?: string[];
};

export const MONEY_FAQ_MAX_DEPOSIT_PER_TOKEN = '$100,000';

/**
 * The Money account FAQ entries shared by the How it works page and the FTUE
 * splash. Order matches the design.
 */
export const MONEY_FAQ_ITEMS: MoneyFaqDefinition[] = [
  {
    id: 'money-account',
    questionKey: 'moneyHowItWorksFaqMoneyAccountQuestion',
    answerKey: 'moneyHowItWorksFaqMoneyAccountAnswer',
    usesApy: true,
  },
  {
    id: 'safe',
    questionKey: 'moneyHowItWorksFaqSafeQuestion',
    answerKey: 'moneyHowItWorksFaqSafeAnswer',
  },
  {
    id: 'controls',
    questionKey: 'moneyHowItWorksFaqControlsQuestion',
    answerKey: 'moneyHowItWorksFaqControlsAnswer',
  },
  {
    id: 'fees',
    questionKey: 'moneyHowItWorksFaqFeesQuestion',
    answerKey: 'moneyHowItWorksFaqFeesAnswer',
  },
  {
    id: 'apy',
    questionKey: 'moneyHowItWorksFaqApyQuestion',
    answerKey: 'moneyHowItWorksFaqApyAnswer',
    usesApy: true,
  },
  {
    id: 'yield',
    questionKey: 'moneyHowItWorksFaqYieldQuestion',
    answerKey: 'moneyHowItWorksFaqYieldAnswer',
  },
  {
    id: 'tokens',
    questionKey: 'moneyHowItWorksFaqTokensQuestion',
    answerKey: 'moneyHowItWorksFaqTokensAnswer',
    substitutions: [MONEY_FAQ_MAX_DEPOSIT_PER_TOKEN],
  },
  {
    id: 'locked',
    questionKey: 'moneyHowItWorksFaqLockedQuestion',
    answerKey: 'moneyHowItWorksFaqLockedAnswer',
  },
  {
    id: 'identity',
    questionKey: 'moneyHowItWorksFaqIdentityQuestion',
    answerKey: 'moneyHowItWorksFaqIdentityAnswer',
  },
  {
    id: 'countries',
    questionKey: 'moneyHowItWorksFaqCountriesQuestion',
    answerKey: 'moneyHowItWorksFaqCountriesAnswer',
  },
];
