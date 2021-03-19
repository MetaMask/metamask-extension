import { cloneDeep } from 'lodash';

const version = 54;

function isValidDecimals(decimals) {
  return (
    typeof decimals === 'number' ||
    (typeof decimals === 'string' && decimals.match(/^(0x)?\d+$/u))
  );
}

/**
 * Migrates preference tokens with decimals typed as string to number.
 * It also removes any tokens with corrupted or inconvertible decimal values.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const newState = state;

  if (!newState.PreferencesController) {
    return newState;
  }

  const tokens = newState.PreferencesController.tokens || [];
  // Filter out any tokens with corrupted decimal values
  const validTokens = tokens.filter(({ decimals }) =>
    isValidDecimals(decimals),
  );
  for (const token of validTokens) {
    // In the case of a decimal value type string, convert to a number.
    if (typeof token.decimals === 'string') {
      // eslint-disable-next-line radix
      token.decimals = parseInt(token.decimals);
    }
  }
  newState.PreferencesController.tokens = validTokens;

  const { accountTokens } = newState.PreferencesController;
  if (accountTokens && typeof accountTokens === 'object') {
    for (const address of Object.keys(accountTokens)) {
      const networkTokens = accountTokens[address];
      if (networkTokens && typeof networkTokens === 'object') {
        for (const network of Object.keys(networkTokens)) {
          const tokensOnNetwork = networkTokens[network] || [];
          // Filter out any tokens with corrupted decimal values
          const validTokensOnNetwork = tokensOnNetwork.filter(({ decimals }) =>
            isValidDecimals(decimals),
          );
          // In the case of a decimal value type string, convert to a number.
          for (const token of validTokensOnNetwork) {
            if (typeof token.decimals === 'string') {
              // eslint-disable-next-line radix
              token.decimals = parseInt(token.decimals);
            }
          }
          networkTokens[network] = validTokensOnNetwork;
        }
      }
    }
  }
  newState.PreferencesController.accountTokens = accountTokens;

  return newState;
}
