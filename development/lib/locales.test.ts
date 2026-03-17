import {
  compareLocalesForUnexpectedReplacementKeys,
  getMessagesWithInvalidReplacementKeys,
} from './locales';

describe('compareLocalesForUnexpectedReplacementKeys', () => {
  it('returns an empty array when translated replacement keys match English', () => {
    expect(
      compareLocalesForUnexpectedReplacementKeys({
        englishLocale: {
          revealSeedWordsDescription1: {
            message: 'Your $1 gives full access to your wallet.',
          },
        },
        targetLocale: {
          revealSeedWordsDescription1: {
            message: '$1 gives full access to your wallet.',
          },
        },
      }),
    ).toStrictEqual([]);
  });

  it('returns an empty array when a translation omits an English replacement key', () => {
    expect(
      compareLocalesForUnexpectedReplacementKeys({
        englishLocale: {
          createPasswordDetailsSocial: {
            message: 'Use your $1 account to continue.',
          },
        },
        targetLocale: {
          createPasswordDetailsSocial: {
            message: 'Continue with your account.',
          },
        },
      }),
    ).toStrictEqual([]);
  });

  it('returns the unexpected replacement keys used by a translation', () => {
    expect(
      compareLocalesForUnexpectedReplacementKeys({
        englishLocale: {
          revealSeedWordsDescription1: {
            message: 'Your $1 gives full access to your wallet.',
          },
        },
        targetLocale: {
          revealSeedWordsDescription1: {
            message: '$1 cung cap $2',
          },
        },
      }),
    ).toStrictEqual([
      {
        englishReplacementKeys: ['$1'],
        key: 'revealSeedWordsDescription1',
        targetReplacementKeys: ['$1', '$2'],
        unexpectedReplacementKeys: ['$2'],
      },
    ]);
  });

  it('handles repeated replacement keys', () => {
    expect(
      compareLocalesForUnexpectedReplacementKeys({
        englishLocale: {
          shieldTxDetails1Title: {
            message: 'Shield details: $1',
          },
        },
        targetLocale: {
          shieldTxDetails1Title: {
            message: 'Shield details: $1 and $1',
          },
        },
      }),
    ).toStrictEqual([]);
  });

  it('does not treat invalid multi-digit placeholders as replacement keys', () => {
    expect(
      compareLocalesForUnexpectedReplacementKeys({
        englishLocale: {
          shieldTxDetails1Title: {
            message: 'Shield details',
          },
        },
        targetLocale: {
          shieldTxDetails1Title: {
            message: 'Shield details $10',
          },
        },
      }),
    ).toStrictEqual([]);
  });
});

describe('getMessagesWithInvalidReplacementKeys', () => {
  it('returns an empty array when locale messages use valid replacement keys', () => {
    expect(
      getMessagesWithInvalidReplacementKeys({
        revealSeedWordsDescription1: {
          message: 'Your $1 gives full access to your wallet.',
        },
      }),
    ).toStrictEqual([]);
  });

  it('returns invalid multi-digit replacement keys used by a locale', () => {
    expect(
      getMessagesWithInvalidReplacementKeys({
        shieldTxDetails1Title: {
          message: 'Shield details $10 $10 $12',
        },
      }),
    ).toStrictEqual([
      {
        invalidReplacementKeys: ['$10', '$12'],
        key: 'shieldTxDetails1Title',
      },
    ]);
  });
});
