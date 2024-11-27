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

const version = 133;

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

const migration = {
  version,
  async migrate(originalVersionedData: VersionedData): Promise<VersionedData> {
    console.log('Migration 133 input:', JSON.stringify(originalVersionedData, null, 2));
    console.log('Starting migration 133', originalVersionedData);
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    versionedData.data = transformState(versionedData.data);
    console.log('Completed migration 133', versionedData);
    return versionedData;
  },
};

export default migration;
