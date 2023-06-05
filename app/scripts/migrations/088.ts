import { hasProperty, Hex, isObject, isStrictHexString } from '@metamask/utils';
import { BN } from 'ethereumjs-util';
import { cloneDeep, mapKeys } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 88;

/**
 * This migration does a few things:
 *
 * - Rebuilds `allNftContracts` and `allNfts` in NftController state to be keyed
 * by a hex chain ID rather than a decimal chain ID.
 * - Rebuilds `tokensChainsCache` in TokenListController to be keyed by a hex
 * chain ID rather than a decimal chain ID.
 * - Rebuilds `allTokens` and `allIgnoredTokens` in TokensController to be keyed
 * by a hex chain ID rather than a decimal chain ID.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  migrateData(versionedData.data);
  return versionedData;
}

function migrateData(state: Record<string, unknown>): void {
  if (hasProperty(state, 'NftController') && isObject(state.NftController)) {
    const nftControllerState = state.NftController;

    // Migrate NftController.allNftContracts
    if (
      hasProperty(nftControllerState, 'allNftContracts') &&
      isObject(nftControllerState.allNftContracts)
    ) {
      const { allNftContracts } = nftControllerState;

      if (
        Object.keys(allNftContracts).every((address) =>
          isObject(allNftContracts[address]),
        )
      ) {
        Object.keys(allNftContracts).forEach((address) => {
          const nftContractsByChainId = allNftContracts[address];

          if (isObject(nftContractsByChainId)) {
            allNftContracts[address] = mapKeys(
              nftContractsByChainId,
              (_, chainId: string) => toHex(chainId),
            );
          }
        });
      }
    }

    // Migrate NftController.allNfts
    if (
      hasProperty(nftControllerState, 'allNfts') &&
      isObject(nftControllerState.allNfts)
    ) {
      const { allNfts } = nftControllerState;

      if (Object.keys(allNfts).every((address) => isObject(allNfts[address]))) {
        Object.keys(allNfts).forEach((address) => {
          const nftsByChainId = allNfts[address];

          if (isObject(nftsByChainId)) {
            allNfts[address] = mapKeys(nftsByChainId, (_, chainId: string) =>
              toHex(chainId),
            );
          }
        });
      }
    }

    state.NftController = nftControllerState;
  }

  if (
    hasProperty(state, 'TokenListController') &&
    isObject(state.TokenListController)
  ) {
    const tokenListControllerState = state.TokenListController;

    // Migrate TokenListController.tokensChainsCache
    if (
      hasProperty(tokenListControllerState, 'tokensChainsCache') &&
      isObject(tokenListControllerState.tokensChainsCache)
    ) {
      tokenListControllerState.tokensChainsCache = mapKeys(
        tokenListControllerState.tokensChainsCache,
        (_, chainId: string) => toHex(chainId),
      );
    }
  }

  if (
    hasProperty(state, 'TokensController') &&
    isObject(state.TokensController)
  ) {
    const tokensControllerState = state.TokensController;

    // Migrate TokensController.allTokens
    if (
      hasProperty(tokensControllerState, 'allTokens') &&
      isObject(tokensControllerState.allTokens)
    ) {
      const { allTokens } = tokensControllerState;

      tokensControllerState.allTokens = mapKeys(
        allTokens,
        (_, chainId: string) => toHex(chainId),
      );
    }

    // Migrate TokensController.allIgnoredTokens
    if (
      hasProperty(tokensControllerState, 'allIgnoredTokens') &&
      isObject(tokensControllerState.allIgnoredTokens)
    ) {
      const { allIgnoredTokens } = tokensControllerState;

      tokensControllerState.allIgnoredTokens = mapKeys(
        allIgnoredTokens,
        (_, chainId: string) => toHex(chainId),
      );
    }

    // Migrate TokensController.allDetectedTokens
    if (
      hasProperty(tokensControllerState, 'allDetectedTokens') &&
      isObject(tokensControllerState.allDetectedTokens)
    ) {
      const { allDetectedTokens } = tokensControllerState;

      tokensControllerState.allDetectedTokens = mapKeys(
        allDetectedTokens,
        (_, chainId: string) => toHex(chainId),
      );
    }

    state.TokensController = tokensControllerState;
  }
}

function toHex(value: number | string | BN): Hex {
  if (typeof value === 'string' && isStrictHexString(value)) {
    return value;
  }
  const hexString = BN.isBN(value)
    ? value.toString(16)
    : new BN(value.toString(), 10).toString(16);
  return `0x${hexString}`;
}
