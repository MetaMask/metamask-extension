import { hasProperty, isObject, isStrictHexString } from '@metamask/utils';

/**
 * Deletes properties of `NftController.allNftContracts`, `NftController.allNfts`,
 * `TokenListController.tokensChainsCache`, `TokensController.allTokens`,
 * `TokensController.allIgnoredTokens` and `TokensController.allDetectedTokens` if
 * their keyed by decimal number chainId and another hexadecimal chainId property
 * exists within the same object.
 * Further explanation in ./077-supplements.md
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export default function transformState077For086(
  state: Record<string, unknown>,
): Record<string, unknown> {
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
          if (
            isObject(nftContractsByChainId) &&
            anyKeysAreHex(nftContractsByChainId)
          ) {
            for (const chainId of Object.keys(nftContractsByChainId)) {
              if (!isStrictHexString(chainId)) {
                delete nftContractsByChainId[chainId];
              }
            }
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
          if (isObject(nftsByChainId) && anyKeysAreHex(nftsByChainId)) {
            for (const chainId of Object.keys(nftsByChainId)) {
              if (!isStrictHexString(chainId)) {
                delete nftsByChainId[chainId];
              }
            }
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
      isObject(tokenListControllerState.tokensChainsCache) &&
      anyKeysAreHex(tokenListControllerState.tokensChainsCache)
    ) {
      for (const chainId of Object.keys(
        tokenListControllerState.tokensChainsCache,
      )) {
        if (!isStrictHexString(chainId)) {
          delete tokenListControllerState.tokensChainsCache[chainId];
        }
      }
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
      isObject(tokensControllerState.allTokens) &&
      anyKeysAreHex(tokensControllerState.allTokens)
    ) {
      const { allTokens } = tokensControllerState;

      for (const chainId of Object.keys(allTokens)) {
        if (!isStrictHexString(chainId)) {
          delete tokensControllerState.allTokens[chainId];
        }
      }
    }

    // Migrate TokensController.allIgnoredTokens
    if (
      hasProperty(tokensControllerState, 'allIgnoredTokens') &&
      isObject(tokensControllerState.allIgnoredTokens) &&
      anyKeysAreHex(tokensControllerState.allIgnoredTokens)
    ) {
      const { allIgnoredTokens } = tokensControllerState;

      for (const chainId of Object.keys(allIgnoredTokens)) {
        if (!isStrictHexString(chainId)) {
          delete tokensControllerState.allIgnoredTokens[chainId];
        }
      }
    }

    // Migrate TokensController.allDetectedTokens
    if (
      hasProperty(tokensControllerState, 'allDetectedTokens') &&
      isObject(tokensControllerState.allDetectedTokens) &&
      anyKeysAreHex(tokensControllerState.allDetectedTokens)
    ) {
      const { allDetectedTokens } = tokensControllerState;

      for (const chainId of Object.keys(allDetectedTokens)) {
        if (!isStrictHexString(chainId)) {
          delete tokensControllerState.allDetectedTokens[chainId];
        }
      }
    }

    state.TokensController = tokensControllerState;
  }
  return state;
}

function anyKeysAreHex(obj: Record<string, unknown>) {
  return Object.keys(obj).some((chainId) => isStrictHexString(chainId));
}
