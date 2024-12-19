import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import type { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';
import { CHAIN_IDS } from '@metamask/transaction-controller';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    PreferencesController?: {
      preferences?: {
        smartTransactionsOptInStatus?: boolean | null;
        smartTransactionsMigrationApplied?: boolean;
      };
    };
    SmartTransactionsController?: {
      smartTransactionsState: {
        smartTransactions: Record<string, SmartTransaction[]>;
      };
    };
  };
};

export const version = 135;

function transformState(state: VersionedData['data']) {
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid PreferencesController state: ${typeof state.PreferencesController}`,
      ),
    );
    return state;
  }
  const { PreferencesController } = state;

  // Ensure PreferencesController.preferences is initialized
  PreferencesController.preferences = {
    ...PreferencesController.preferences,
  };

  const currentOptInStatus =
    PreferencesController.preferences.smartTransactionsOptInStatus;

  if (
    currentOptInStatus === undefined ||
    currentOptInStatus === null ||
    (currentOptInStatus === false && !hasExistingSmartTransactions(state))
  ) {
    PreferencesController.preferences.smartTransactionsOptInStatus = true;
  }

  // Ensure state.PreferencesController.preferences is initialized
  state.PreferencesController.preferences = {
    ...state.PreferencesController.preferences,
  };

  // Apply migration
  state.PreferencesController.preferences.smartTransactionsMigrationApplied =
    true;

  return state;
}

function hasExistingSmartTransactions(state: VersionedData['data']): boolean {
  const smartTransactions =
    state?.SmartTransactionsController?.smartTransactionsState
      ?.smartTransactions;

  if (!isObject(smartTransactions)) {
    return false;
  }

  return (smartTransactions[CHAIN_IDS.MAINNET] || []).length > 0;
}

export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}
