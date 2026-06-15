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
        key: 'revealSeedWordsDescription1',
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

  it('skips replacement-key parity checks when a translation uses invalid replacement keys', () => {
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

  it('matches the runtime parser for single-digit replacement keys inside larger strings', () => {
    expect(
      compareLocalesForUnexpectedReplacementKeys({
        englishLocale: {
          shieldTxDetails2Title: {
            message: 'Shield details: $1',
          },
        },
        targetLocale: {
          shieldTxDetails2Title: {
            message: 'Shield details: $$2',
          },
        },
      }),
    ).toStrictEqual([
      {
        key: 'shieldTxDetails2Title',
        unexpectedReplacementKeys: ['$2'],
      },
    ]);
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

  it('returns invalid replacement keys used by a locale', () => {
    expect(
      getMessagesWithInvalidReplacementKeys({
        shieldTxDetails1Title: {
          message: 'Shield details $0 $10 $10 $12',
        },
      }),
    ).toStrictEqual([
      {
        invalidReplacementKeys: ['$0', '$10', '$12'],
        key: 'shieldTxDetails1Title',
      },
    ]);
  });

  it('returns the full invalid replacement key when it starts with zero', () => {
    expect(
      getMessagesWithInvalidReplacementKeys({
        shieldTxDetails1Title: {
          message: 'Shield details $01',
        },
      }),
    ).toStrictEqual([
      {
        invalidReplacementKeys: ['$01'],
        key: 'shieldTxDetails1Title',
      },
    ]);
  });
});
