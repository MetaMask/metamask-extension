import { cloneDeep } from 'lodash';
import { hasProperty, isObject, getErrorMessage } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 185;

export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  try {
    transformState(versionedData.data);
  } catch (err) {
    console.error(err);
    const error = new Error(
      `Migration #${version} failed: ${getErrorMessage(err)}`,
    );
    captureException(error);

    // Keep original data to avoid corrupting state
    versionedData.data = originalVersionedData.data;
  }

  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  //
  // -- Step 1: Validate TransactionController exists
  //
  if (!hasProperty(state, 'TransactionController')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: state.TransactionController is not defined`,
      ),
    );
    return state;
  }

  const txController = state.TransactionController;

  if (!isObject(txController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.TransactionController is ${typeof txController}`,
      ),
    );
    return state;
  }

  //
  // -- Step 2: Validate transactions is an array
  //
  if (!hasProperty(txController, 'transactions')) {
    console.warn(
      `Migration ${version}: state.TransactionController.transactions not found, skipping.`,
    );
    return state;
  }

  if (!Array.isArray(txController.transactions)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: state.TransactionController.transactions is not an array: ${typeof txController.transactions}`,
      ),
    );
    return state;
  }

  //
  // -- Step 3: Clean fields from each tx
  //
  txController.transactions = txController.transactions.map((tx) => {
    if (!isObject(tx)) {
      return tx;
    }

    const updated = { ...tx };

    updated.history = [];
    updated.sendFlowHistory = [];

    return updated;
  });

  return state;
}
