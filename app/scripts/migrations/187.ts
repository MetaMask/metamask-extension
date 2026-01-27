import { hasProperty, isObject, getErrorMessage } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 187;

export async function migrate(
  originalVersionedData: VersionedData,
  changedControllers: Set<string>,
): Promise<void> {
  originalVersionedData.meta.version = version;
  try {
    const didUpdate = transformState(originalVersionedData.data);
    if (didUpdate) {
      changedControllers.add('TransactionController');
    }
  } catch (err) {
    console.error(err);
    const error = new Error(
      `Migration #${version} failed: ${getErrorMessage(err)}`,
    );
    captureException(error);
  }
}

function transformState(state: Record<string, unknown>): boolean {
  //
  // -- Step 1: Validate TransactionController exists
  //
  if (!hasProperty(state, 'TransactionController')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: state.TransactionController is not defined`,
      ),
    );
    return false;
  }

  const txController = state.TransactionController;

  if (!isObject(txController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.TransactionController is ${typeof txController}`,
      ),
    );
    return false;
  }

  //
  // -- Step 2: Validate transactions is an array
  //
  if (!hasProperty(txController, 'transactions')) {
    console.warn(
      `Migration ${version}: state.TransactionController.transactions not found, skipping.`,
    );
    return false;
  }

  if (!Array.isArray(txController.transactions)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: state.TransactionController.transactions is not an array: ${typeof txController.transactions}`,
      ),
    );
    return false;
  }

  //
  // -- Step 3: Remove fields from each tx
  //
  txController.transactions = txController.transactions.map((tx) => {
    if (!isObject(tx)) {
      return tx;
    }

    const updated = { ...tx };
    delete updated.history;
    delete updated.sendFlowHistory;

    return updated;
  });

  return true;
}
