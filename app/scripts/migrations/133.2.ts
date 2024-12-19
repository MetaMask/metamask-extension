import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 133.2;

/**
 *
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

/**
 * Transforms the TokensController state to remove tokens with `decimals === null`.
 *
 * @param state - The persisted MetaMask state.
 */
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
    if (!isObject(state.TokensController.allTokens[chainId])) {
      continue;
    }

    for (const [account, tokens] of Object.entries(
      state.TokensController.allTokens[chainId],
    )) {
      if (!Array.isArray(tokens)) {
        continue;
      }

      state.TokensController.allTokens[chainId][account] = tokens.filter(
        (token) =>
          token.address !== '0x0000000000000000000000000000000000000000',
      );
    }
  }
}
