import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 133.1;

/**
 * Removes tokens with `decimals === null` from `allTokens`, `allDetectedTokens`, `tokens`, and `detectedTokens`.
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
    if (isObject(tokensControllerState.allTokens)) {
      tokensControllerState.allTokens = transformTokenCollection(
        tokensControllerState.allTokens,
        'allTokens',
      );
    } else {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: Invalid allTokens state of type '${typeof tokensControllerState.allTokens}'`,
        ),
      );
    }
  }

  // Validate and transform `allDetectedTokens`
  if (hasProperty(tokensControllerState, 'allDetectedTokens')) {
    if (isObject(tokensControllerState.allDetectedTokens)) {
      tokensControllerState.allDetectedTokens = transformTokenCollection(
        tokensControllerState.allDetectedTokens,
        'allDetectedTokens',
      );
    } else {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: Invalid allDetectedTokens state of type '${typeof tokensControllerState.allDetectedTokens}'`,
        ),
      );
    }
  }

  // Transform `tokens` array
  if (
    hasProperty(tokensControllerState, 'tokens') &&
    Array.isArray(tokensControllerState.tokens)
  ) {
    tokensControllerState.tokens = tokensControllerState.tokens.filter(
      (token) => {
        if (
          isObject(token) &&
          hasProperty(token, 'decimals') &&
          token.decimals === null &&
          hasProperty(token, 'address')
        ) {
          global.sentry?.captureMessage(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `Migration ${version}: Removed token with decimals === null in tokens. Address: ${token.address}`,
          );
          return false;
        }
        return true;
      },
    );
  } else if (hasProperty(tokensControllerState, 'tokens')) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid tokens state of type '${typeof tokensControllerState.tokens}'`,
      ),
    );
  }

  // Transform `detectedTokens` array
  if (
    hasProperty(tokensControllerState, 'detectedTokens') &&
    Array.isArray(tokensControllerState.detectedTokens)
  ) {
    tokensControllerState.detectedTokens =
      tokensControllerState.detectedTokens.filter((token) => {
        if (
          isObject(token) &&
          hasProperty(token, 'decimals') &&
          token.decimals === null &&
          hasProperty(token, 'address')
        ) {
          global.sentry?.captureMessage(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `Migration ${version}: Removed token with decimals === null in detectedTokens. Address: ${token.address}`,
          );
          return false;
        }
        return true;
      });
  } else if (hasProperty(tokensControllerState, 'detectedTokens')) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid detectedTokens state of type '${typeof tokensControllerState.detectedTokens}'`,
      ),
    );
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
              global.sentry?.captureMessage(
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `Migration ${version}: Removed token with decimals === null in ${propertyName}. Address: ${token.address}`,
              );
              return false; // Exclude token
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
