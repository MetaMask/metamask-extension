import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 153;

/**
 * This migration removes the `tokens` property from the TokensController state.
 *
 * If the TokensController is not found or is not an object, the migration logs an error,
 * but otherwise leaves the state unchanged.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state without the tokens property.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!hasProperty(state, 'TokensController')) {
    console.warn(`newState.TokensController is not present`);
    return state;
  }

  const tokensControllerState = state.TokensController;

  if (!isObject(tokensControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: TokensController is type '${typeof tokensControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (!hasProperty(state, 'TokenListController')) {
    console.warn(`newState.TokenListController is not present`);
    return state;
  }

  const tokenListControllerState = state.TokenListController;

  if (!isObject(tokenListControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: TokenListController is type '${typeof tokenListControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (hasProperty(tokensControllerState, 'tokens')) {
    // Remove the tokens property from the TokensController state.
    delete tokensControllerState.tokens;
  }

  if (hasProperty(tokensControllerState, 'detectedTokens')) {
    // Remove the detectedTokens property from the TokensController state.
    delete tokensControllerState.detectedTokens;
  }

  if (hasProperty(tokensControllerState, 'ignoredTokens')) {
    // Remove the ignoredTokens property from the TokensController state.
    delete tokensControllerState.ignoredTokens;
  }

  if (hasProperty(tokenListControllerState, 'tokenList')) {
    // Remove the tokenList property from the TokenListController state.
    delete tokenListControllerState.tokenList;
  }

  return state;
}
