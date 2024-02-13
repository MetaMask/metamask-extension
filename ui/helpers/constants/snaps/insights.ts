type InsightLanguageMapper = {
  [action: string]: {
    noun: string;
    imperative: string;
  };
};

/**
 * Mapping of actions to the language needed to be used in
 * the translations for the insight warnings modal.
 */
export const InsightWarningLanguage: InsightLanguageMapper = {
  confirming: {
    noun: 'confirmation',
    imperative: 'confirm',
  },
  signing: {
    noun: 'signature',
    imperative: 'sign',
  },
};
