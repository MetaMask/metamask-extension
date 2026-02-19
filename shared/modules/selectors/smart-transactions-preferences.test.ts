import {
  getPreferences,
  getSmartTransactionsMigrationAppliedInternal,
  getSmartTransactionsOptInStatusInternal,
} from './smart-transactions-preferences';

describe('Smart Transactions Preferences Selectors', () => {
  it('returns preferences from state', () => {
    const state = {
      metamask: {
        preferences: {
          smartTransactionsOptInStatus: false,
        },
      },
    };

    expect(getPreferences(state)).toStrictEqual(state.metamask.preferences);
  });

  it('returns default preferences object when preferences are missing', () => {
    const state = {
      metamask: {},
    };

    expect(getPreferences(state)).toStrictEqual({});
  });

  describe('getSmartTransactionsOptInStatusInternal', () => {
    it('returns true by default when value is missing', () => {
      const state = {
        metamask: {
          preferences: {},
        },
      };

      expect(getSmartTransactionsOptInStatusInternal(state)).toBe(true);
    });

    it('returns configured opt-in status', () => {
      const state = {
        metamask: {
          preferences: {
            smartTransactionsOptInStatus: false,
          },
        },
      };

      expect(getSmartTransactionsOptInStatusInternal(state)).toBe(false);
    });
  });

  describe('getSmartTransactionsMigrationAppliedInternal', () => {
    it('returns false by default when value is missing', () => {
      const state = {
        metamask: {
          preferences: {},
        },
      };

      expect(getSmartTransactionsMigrationAppliedInternal(state)).toBe(false);
    });

    it('returns configured migration-applied status', () => {
      const state = {
        metamask: {
          preferences: {
            smartTransactionsMigrationApplied: true,
          },
        },
      };

      expect(getSmartTransactionsMigrationAppliedInternal(state)).toBe(true);
    });
  });
});
