import { isSolanaChainId } from '@metamask/bridge-controller';
import { type BridgeStatusControllerState } from '@metamask/bridge-status-controller';
import { cloneDeep } from 'lodash';

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

  if (
    !bridgeStatusControllerState ||
    typeof bridgeStatusControllerState !== 'object'
  ) {
    return state;
  }

  const { txHistory } =
    bridgeStatusControllerState as BridgeStatusControllerState;

  if (!txHistory || Object.keys(txHistory).length === 0) {
    return state;
  }

  const newTxHistory = Object.entries<
    BridgeStatusControllerState['txHistory'][string]
  >(txHistory as unknown as BridgeStatusControllerState['txHistory']).reduce<
    Record<string, BridgeStatusControllerState['txHistory'][string]>
  >((acc, [key, historyItem]) => {
    // Check if src chain is solana
    const srcChainId =
      historyItem.status?.srcChain?.chainId ?? historyItem.quote?.srcChainId;
    const isSolanaTx = isSolanaChainId(srcChainId);
    // If solana tx, use the src chain tx hash as the key
    const newKey = isSolanaTx ? historyItem.status?.srcChain?.txHash : key;

    return {
      ...acc,
      [newKey ?? key]: { ...historyItem },
    };
  }, {});

  const newState = {
    ...state,
    BridgeStatusController: {
      ...bridgeStatusControllerState,
      txHistory: newTxHistory,
    },
  };

  return newState;
}
