import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 135;

/**
 * Removes tokens with `decimals === null` from `allTokens`, `allIgnoredTokens`, and `allDetectedTokens`.
 * Captures exceptions for invalid states using Sentry and logs tokens with `decimals === null`.
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
  if (!hasProperty(state, 'TokensController')) {
    return;
  }

  const tokensControllerState = state.TokensController;

  if (!isObject(tokensControllerState)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid TokensController state of type '${typeof tokensControllerState}'`,
      ),
    );
    return;
  }

  // Validate and transform `allTokens`
  if (hasProperty(tokensControllerState, 'allTokens')) {
    if (!isObject(tokensControllerState.allTokens)) {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: Invalid allTokens state of type '${typeof tokensControllerState.allTokens}'`,
        ),
      );
    } else {
      tokensControllerState.allTokens = transformTokenCollection(
        tokensControllerState.allTokens,
        'allTokens',
      );
    }
  }

  // Validate and transform `allIgnoredTokens`
  if (hasProperty(tokensControllerState, 'allIgnoredTokens')) {
    if (!isObject(tokensControllerState.allIgnoredTokens)) {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: Invalid allIgnoredTokens state of type '${typeof tokensControllerState.allIgnoredTokens}'`,
        ),
      );
    } else {
      tokensControllerState.allIgnoredTokens = transformTokenCollection(
        tokensControllerState.allIgnoredTokens,
        'allIgnoredTokens',
      );
    }
  }

  // Validate and transform `allDetectedTokens`
  if (hasProperty(tokensControllerState, 'allDetectedTokens')) {
    if (!isObject(tokensControllerState.allDetectedTokens)) {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: Invalid allDetectedTokens state of type '${typeof tokensControllerState.allDetectedTokens}'`,
        ),
      );
    } else {
      tokensControllerState.allDetectedTokens = transformTokenCollection(
        tokensControllerState.allDetectedTokens,
        'allDetectedTokens',
      );
    }
  }
}

/**
 * Removes tokens with `decimals === null` from a token collection and logs their addresses.
 *
 * @param tokenCollection - The token collection to transform.
 * @param propertyName - The name of the property being transformed (for logging purposes).
 * @returns The updated token collection.
 */
function transformTokenCollection(
  tokenCollection: Record<string, unknown>,
  propertyName: string,
) {
  const updatedState: Record<string, unknown> = {};

  for (const [chainId, accounts] of Object.entries(tokenCollection)) {
    if (isObject(accounts)) {
      const updatedTokensAccounts: Record<string, unknown[]> = {};

      for (const [account, tokens] of Object.entries(accounts)) {
        if (Array.isArray(tokens)) {
          // Filter tokens and log those with `decimals === null`
          const filteredTokens = tokens.filter((token) => {
            if (
              isObject(token) &&
              hasProperty(token, 'decimals') &&
              token.decimals === null &&
              hasProperty(token, 'address')
            ) {
              // Log the token's address and then exclude it
              global.sentry?.captureMessage(
                `Migration ${version}: Removed token with decimals === null in ${propertyName}. Address: ${token.address}`,
              );
              return false; // Exclude this token
            }
            return (
              isObject(token) &&
              hasProperty(token, 'decimals') &&
              token.decimals !== null
            );
          });

          updatedTokensAccounts[account] = filteredTokens;
        }
      }

      updatedState[chainId] = updatedTokensAccounts;
    }
  }

  return updatedState;
}
