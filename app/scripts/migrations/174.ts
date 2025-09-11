import { isSolanaChainId } from '@metamask/bridge-controller';
import { isObject } from '@metamask/utils';
import { type BridgeStatusControllerState } from '@metamask/bridge-status-controller';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

export const version = 174;

/**
 * This migration fixes txHistory entries that were added with keys that were not valid
 * Solana tx signatures.
 *
 * For existing txs with invalid keys, the migration will remove the txHistory entry and add
 * it back with a valid key.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  const bridgeStatusControllerState = state?.BridgeStatusController;
  if (!isObject(bridgeStatusControllerState)) {
    return state;
  }

  const { txHistory } =
    bridgeStatusControllerState as BridgeStatusControllerState;
  if (!isObject(txHistory)) {
    return state;
  }

  try {
    Object.entries(txHistory).forEach(([key, historyItem]) => {
      const isSolanaTx = isSolanaChainId(historyItem.status?.srcChain?.chainId);
      const newId = historyItem.status?.srcChain?.txHash;
      if (isSolanaTx && newId && newId !== key) {
        txHistory[newId] = {
          ...historyItem,
          txMetaId: newId,
        };
        delete txHistory[key];
      }
    });

    return state;
  } catch (error) {
    captureException(
      new Error(
        `Migration ${version}: Failed to update bridge txHistory for solana to use txHash as key and txMetaId. Error: ${(error as Error).message}`,
      ),
    );
    return state;
  }
}
