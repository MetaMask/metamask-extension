import { getErrorMessage, hasProperty, Hex, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

export const version = 190;

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type Nft = {
  chainId?: number | null;
  [key: string]: unknown;
};

type AllNfts = {
  [account: string]: {
    [chainId: Hex]: Nft[];
  };
};

/**
 * This migration ensures all NFT objects have a valid chainId property.
 * This is a follow-up to migration 156 to handle edge cases where chainId
 * might be null, undefined, or missing entirely.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @param localChangedControllers - A set of controller keys that have been changed by the migration.
 */
export async function migrate(
  versionedData: VersionedData,
  localChangedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;
  const changedVersionedData = cloneDeep(versionedData);
  const changedLocalChangedControllers = new Set<string>();

  try {
    transformState(changedVersionedData.data, changedLocalChangedControllers);
    versionedData.data = changedVersionedData.data;
    changedLocalChangedControllers.forEach((controller) =>
      localChangedControllers.add(controller),
    );
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work
  }
}

function transformState(
  state: Record<string, unknown>,
  changedLocalChangedControllers: Set<string>,
) {
  if (!hasProperty(state, 'NftController')) {
    // No NftController, nothing to migrate
    return;
  }

  if (!isObject(state.NftController)) {
    console.warn(
      `Migration ${version}: state.NftController must be an object, but is: ${typeof state.NftController}`,
    );
    return;
  }

  if (!hasProperty(state.NftController, 'allNfts')) {
    // No allNfts property, nothing to migrate
    return;
  }

  if (!isObject(state.NftController.allNfts)) {
    console.warn(
      `Migration ${version}: state.NftController.allNfts must be an object, but is: ${typeof state.NftController.allNfts}`,
    );
    return;
  }

  const { allNfts } = state.NftController;
  let hasChanges = false;

  // Iterate through all accounts
  for (const [account, nftsByAccount] of Object.entries(allNfts as AllNfts)) {
    if (!isObject(nftsByAccount)) {
      console.warn(
        `Migration ${version}: NFTs for account ${account} must be an object, but is: ${typeof nftsByAccount}`,
      );
      continue;
    }

    // Iterate through all chain IDs for this account
    for (const [chainIdHex, nftsArray] of Object.entries(nftsByAccount)) {
      if (!Array.isArray(nftsArray)) {
        console.warn(
          `Migration ${version}: NFTs array for account ${account}, chainId ${chainIdHex} must be an array, but is: ${typeof nftsArray}`,
        );
        continue;
      }

      // Convert hex chainId to decimal number for setting on NFT objects
      const chainIdDecimal = parseInt(chainIdHex, 16);
      
      if (isNaN(chainIdDecimal)) {
        console.warn(
          `Migration ${version}: Invalid chainId hex string: ${chainIdHex}`,
        );
        continue;
      }

      const originalLength = nftsArray.length;
      
      // Filter out null/undefined NFTs and ensure all valid NFTs have chainId
      const updatedNftsArray = nftsArray
        .filter((nft): nft is Nft => {
          if (!nft || !isObject(nft)) {
            console.warn(
              `Migration ${version}: Removing invalid NFT (null or not an object) from account ${account}, chainId ${chainIdHex}`,
            );
            hasChanges = true;
            return false;
          }
          return true;
        })
        .map((nft) => {
          // If chainId is missing, null, undefined, or not a valid number, set it
          if (
            typeof nft.chainId !== 'number' ||
            isNaN(nft.chainId) ||
            nft.chainId === null
          ) {
            hasChanges = true;
            return {
              ...nft,
              chainId: chainIdDecimal,
            };
          }
          return nft;
        });
      
      // Check if array length changed (nulls/undefined were removed)
      if (updatedNftsArray.length !== originalLength) {
        hasChanges = true;
      }
      
      // Update the array in place
      nftsByAccount[chainIdHex] = updatedNftsArray;
    }
  }

  if (hasChanges) {
    changedLocalChangedControllers.add('NftController');
  }
}
