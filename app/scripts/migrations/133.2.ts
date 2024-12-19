import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 133.2;

/**
 * This migration removes tokens on mainnet with the
 * zero address, since this is not a valid erc20 token.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>): void {
  if (
    !hasProperty(state, 'TokensController') ||
    !isObject(state.TokensController) ||
    !isObject(state.TokensController.allTokens)
  ) {
    return;
  }

  const chainIds = ['0x1'];

  for (const chainId of chainIds) {
    const allTokensOnChain = state.TokensController.allTokens[chainId];

    if (isObject(allTokensOnChain)) {
      for (const [account, tokens] of Object.entries(allTokensOnChain)) {
        if (Array.isArray(tokens)) {
          allTokensOnChain[account] = tokens.filter(
            (token) =>
              token?.address !== '0x0000000000000000000000000000000000000000',
          );
        }
      }
    }
  }
}
