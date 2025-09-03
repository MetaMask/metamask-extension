import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 163;

/**
 * This migration removes the `tokens`, `detectedTokens`, and `ignoredTokens` properties from the TokensController state for users who do not have tokenListController state.
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
  // If property TokensController is not present, only log a warning and return the original state.
  if (!hasProperty(state, 'TokensController')) {
    console.warn(`newState.TokensController is not present`);
    return state;
  }

  const tokensControllerState = state.TokensController;

  // If property tokensControllerState is there but not an object, capture a sentry error and return state
  if (!isObject(tokensControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: TokensController is type '${typeof tokensControllerState}', expected object.`,
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

  return state;
}
