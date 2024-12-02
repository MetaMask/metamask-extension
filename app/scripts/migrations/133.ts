import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import type { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    PreferencesController?: {
      smartTransactionsOptInStatus?: boolean | null;
    };
    SmartTransactionsController?: {
      smartTransactionsState: {
        smartTransactions: Record<string, SmartTransaction[]>;
      };
    };
  };
};

export const version = 133;

function transformState(state: VersionedData['data']) {
  console.log('Migration 133 state:', JSON.stringify(state, null, 2));
  console.log('Transform state input:', state);
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid PreferencesController state: ${typeof state.PreferencesController}`,
      ),
    );
    console.log('Invalid PreferencesController state');
    return state;
  }

  const { PreferencesController } = state;
  const currentOptInStatus =
    PreferencesController?.smartTransactionsOptInStatus;
  console.log('Current STX opt-in status:', currentOptInStatus);

  if (currentOptInStatus === undefined || currentOptInStatus === null) {
    console.log('Setting null/undefined status to true');
    PreferencesController.smartTransactionsOptInStatus = true;
  } else if (
    currentOptInStatus === false &&
    !hasExistingSmartTransactions(state)
  ) {
    console.log('Setting false status to true (no existing transactions)');
    PreferencesController.smartTransactionsOptInStatus = true;
  }

  return state;
}

function hasExistingSmartTransactions(state: VersionedData['data']): boolean {
  if (
    !hasProperty(state, 'SmartTransactionsController') ||
    !isObject(
      state.SmartTransactionsController?.smartTransactionsState
        ?.smartTransactions,
    )
  ) {
    return false;
  }

  const { smartTransactions } =
    state.SmartTransactionsController.smartTransactionsState;

  return Object.values(smartTransactions).some(
    (chainSmartTransactions: SmartTransaction[]) =>
      chainSmartTransactions.length > 0,
  );
}

export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  console.log('=== MIGRATION 133 START ===');
  console.log('Original version:', originalVersionedData.meta.version);
  console.log('Original data:', JSON.stringify(originalVersionedData.data, null, 2));
  const versionedData = cloneDeep(originalVersionedData);
  console.log('STX status before:', versionedData.data?.PreferencesController?.smartTransactionsOptInStatus);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  console.log('STX status after:', versionedData.data?.PreferencesController?.smartTransactionsOptInStatus);
  console.log('=== MIGRATION 133 END ===');
  return versionedData;
}
