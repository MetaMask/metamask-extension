import { hasProperty, Hex, isObject, isStrictHexString } from '@metamask/utils';
import BN from 'bn.js';
import { cloneDeep, mapKeys } from 'lodash';
import log from 'loglevel';

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
 * - Rebuilds `allTokens`, `allDetectedTokens`, and `allIgnoredTokens` in
 * TokensController to be keyed by a hex chain ID rather than a decimal chain ID.
 * - removes any entries in `allNftContracts`, `allNfts`, `tokensChainsCache`,
 * `allTokens`, `allIgnoredTokens` or `allDetectedTokens` that are keyed by the
 * string 'undefined'
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
            for (const chainId of Object.keys(nftContractsByChainId)) {
              if (
                chainId === 'undefined' ||
                chainId === undefined ||
                chainId === 'null'
              ) {
                delete nftContractsByChainId[chainId];
              }
            }

            allNftContracts[address] = mapKeys(
              nftContractsByChainId,
              (_, chainId: string) => toHex(chainId),
            );
          }
        });
      }
    } else if (hasProperty(nftControllerState, 'allNftContracts')) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.NftController.allNftContracts is ${typeof nftControllerState.allNftContracts}`,
        ),
      );
    } else {
      log.warn(
        `typeof state.NftController.allNftContracts is ${typeof nftControllerState.allNftContracts}`,
      );
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
            for (const chainId of Object.keys(nftsByChainId)) {
              if (
                chainId === 'undefined' ||
                chainId === undefined ||
                chainId === 'null'
              ) {
                delete nftsByChainId[chainId];
              }
            }

            allNfts[address] = mapKeys(nftsByChainId, (_, chainId: string) =>
              toHex(chainId),
            );
          }
        });
      }
    } else if (hasProperty(nftControllerState, 'allNfts')) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.NftController.allNfts is ${typeof nftControllerState.allNfts}`,
        ),
      );
    } else {
      log.warn(
        `typeof state.NftController.allNfts is ${typeof nftControllerState.allNfts}`,
      );
    }

    state.NftController = nftControllerState;
  } else if (hasProperty(state, 'NftController')) {
    global.sentry?.captureException?.(
      new Error(`typeof state.NftController is ${typeof state.NftController}`),
    );
  } else {
    log.warn(`typeof state.NftController is undefined`);
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
      for (const chainId of Object.keys(
        tokenListControllerState.tokensChainsCache,
      )) {
        if (
          chainId === 'undefined' ||
          chainId === undefined ||
          chainId === 'null'
        ) {
          delete tokenListControllerState.tokensChainsCache[chainId];
        }
      }

      tokenListControllerState.tokensChainsCache = mapKeys(
        tokenListControllerState.tokensChainsCache,
        (_, chainId: string) => toHex(chainId),
      );
    } else if (hasProperty(tokenListControllerState, 'tokensChainsCache')) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.TokenListController.tokensChainsCache is ${typeof state
            .TokenListController.tokensChainsCache}`,
        ),
      );
    } else {
      log.warn(
        `typeof state.TokenListController.tokensChainsCache is undefined`,
      );
    }
  } else {
    log.warn(
      `typeof state.TokenListController is ${typeof state.TokenListController}`,
    );
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

      for (const chainId of Object.keys(allTokens)) {
        if (
          chainId === 'undefined' ||
          chainId === undefined ||
          chainId === 'null'
        ) {
          delete allTokens[chainId];
        }
      }

      tokensControllerState.allTokens = mapKeys(
        allTokens,
        (_, chainId: string) => toHex(chainId),
      );
    } else if (hasProperty(tokensControllerState, 'allTokens')) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.TokensController.allTokens is ${typeof tokensControllerState.allTokens}`,
        ),
      );
    } else {
      log.warn(
        `typeof state.TokensController.allTokens is ${typeof tokensControllerState.allTokens}`,
      );
    }

    // Migrate TokensController.allIgnoredTokens
    if (
      hasProperty(tokensControllerState, 'allIgnoredTokens') &&
      isObject(tokensControllerState.allIgnoredTokens)
    ) {
      const { allIgnoredTokens } = tokensControllerState;

      for (const chainId of Object.keys(allIgnoredTokens)) {
        if (
          chainId === 'undefined' ||
          chainId === undefined ||
          chainId === 'null'
        ) {
          delete allIgnoredTokens[chainId];
        }
      }

      tokensControllerState.allIgnoredTokens = mapKeys(
        allIgnoredTokens,
        (_, chainId: string) => toHex(chainId),
      );
    } else if (hasProperty(tokensControllerState, 'allIgnoredTokens')) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.TokensController.allIgnoredTokens is ${typeof tokensControllerState.allIgnoredTokens}`,
        ),
      );
    } else {
      log.warn(
        `typeof state.TokensController.allIgnoredTokens is ${typeof tokensControllerState.allIgnoredTokens}`,
      );
    }

    // Migrate TokensController.allDetectedTokens
    if (
      hasProperty(tokensControllerState, 'allDetectedTokens') &&
      isObject(tokensControllerState.allDetectedTokens)
    ) {
      const { allDetectedTokens } = tokensControllerState;

      for (const chainId of Object.keys(allDetectedTokens)) {
        if (
          chainId === 'undefined' ||
          chainId === undefined ||
          chainId === 'null'
        ) {
          delete allDetectedTokens[chainId];
        }
      }

      tokensControllerState.allDetectedTokens = mapKeys(
        allDetectedTokens,
        (_, chainId: string) => toHex(chainId),
      );
    } else if (hasProperty(tokensControllerState, 'allDetectedTokens')) {
      global.sentry?.captureException?.(
        new Error(
          `typeof state.TokensController.allDetectedTokens is ${typeof tokensControllerState.allDetectedTokens}`,
        ),
      );
    } else {
      log.warn(
        `typeof state.TokensController.allDetectedTokens is ${typeof tokensControllerState.allDetectedTokens}`,
      );
    }

    state.TokensController = tokensControllerState;
  } else {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.TokensController is ${typeof state.TokensController}`,
      ),
    );
  }
}

function toHex(value: number | string | BN): Hex {
  if (typeof value === 'string' && isStrictHexString(value)) {
    return value;
  }
  const hexString = BN.isBN(value)
    ? value.toString(16)
    : new BN(value.toString(10), 10).toString(16);
  return `0x${hexString}`;
}
