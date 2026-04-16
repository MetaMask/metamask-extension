import { Nft } from '@metamask/assets-controllers';
import { getErrorMessage, hasProperty, Hex, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 156;

type AllNfts = {
  [key: string]: {
    [chainId: Hex]: Nft[];
  };
};

/**
 * This migration corrects chainIds in NftController state.
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
  try {
    versionedData.data = transformState(versionedData.data);
  } catch (error) {
    global.sentry?.captureException?.(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
  }
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  const newState = cloneDeep(state);

  if (!hasProperty(newState, 'NftController')) {
    console.warn(`newState.NftController must be present`);
    return state;
  }

  if (!isObject(newState.NftController)) {
    throw new Error(
      `state.NftController must be an object, but is: ${typeof newState.NftController}`,
    );
  }
  if (!hasProperty(newState.NftController, 'allNfts')) {
    throw new Error(`state.NftController.allNfts must be present`);
  }

  if (!isObject(newState.NftController.allNfts)) {
    throw new Error(
      `state.NftController.allNfts must be an object, but is: ${typeof newState
        .NftController.allNfts}`,
    );
  }

  const { allNfts } = newState.NftController;

  for (const NftsByAccount of Object.values(allNfts as AllNfts)) {
    for (const [chainId, allNftsByChainId] of Object.entries(NftsByAccount)) {
      allNftsByChainId.forEach((single) => {
        if (!single?.chainId) {
          single.chainId = Number(chainId);
        }
      });
    }
  }

  return newState;
}
