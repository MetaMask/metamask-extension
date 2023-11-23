import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 104;

/**
 * This migration converts the transactions object used by the extension transaction controller
 * to an array of transactions used by the core transaction controller.
 *
 * @param originalVersionedData
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, any>) {
  const transactionControllerState = state?.TransactionController;

  if (!transactionControllerState) {
    return;
  }

  const transactionsObject = transactionControllerState?.transactions || {};

  const transactionsArray = Object.values(transactionsObject).sort(
    (a: any, b: any) => (a.time > b.time ? -1 : 1), // Descending
  );

  state.TransactionController = {
    ...transactionControllerState,
    transactions: transactionsArray,
  };
}
