import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import type { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    PreferencesController?: {
      preferences?: {
        smartTransactionsOptInStatus?: boolean | null;
      };
      smartTransactionsOptInStatus?: boolean | null;
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
  const currentOptInStatus =
    PreferencesController?.smartTransactionsOptInStatus;
  if (currentOptInStatus === undefined || currentOptInStatus === null) {
    PreferencesController.smartTransactionsOptInStatus = true;
  } else if (
    currentOptInStatus === false &&
    !hasExistingSmartTransactions(state)
  ) {
    PreferencesController.smartTransactionsOptInStatus = true;
  }
  if (!state.PreferencesController.preferences) {
    state.PreferencesController.preferences = {};
  }

  const { preferences } = state.PreferencesController;
  preferences.smartTransactionsOptInStatus = true;

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
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}
