import { createSelector } from 'reselect';

type SmartTransactionsPreferences = {
  smartTransactionsOptInStatus?: boolean;
  smartTransactionsMigrationApplied?: boolean;
};

type SmartTransactionsPreferencesState = {
  metamask: {
    preferences?: SmartTransactionsPreferences;
  };
};

export const getPreferences = ({
  metamask,
}: SmartTransactionsPreferencesState): SmartTransactionsPreferences => {
  return metamask.preferences ?? {};
};

/**
 * Returns the user's explicit smart transactions opt-in status.
 * Defaults to `true` when not set.
 */
export const getSmartTransactionsOptInStatusInternal = createSelector(
  getPreferences,
  (preferences): boolean => {
    return preferences.smartTransactionsOptInStatus ?? true;
  },
);

/**
 * Returns whether the smart transactions migration has been applied.
 * Defaults to `false` when not set.
 */
export const getSmartTransactionsMigrationAppliedInternal = createSelector(
  getPreferences,
  (preferences): boolean => {
    return preferences.smartTransactionsMigrationApplied ?? false;
  },
);
