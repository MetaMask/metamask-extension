import { cloneDeep } from 'lodash';

const version = 63;

/**
 * Moves token state from preferences controller to TokensController
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
  const accountTokens = state?.PreferencesController?.accountTokens;
  const accountHiddenTokens = state?.PreferencesController?.accountHiddenTokens;

  const newAllTokens = {};
  if (accountTokens) {
    Object.keys(accountTokens).forEach((accountAddress) => {
      Object.keys(accountTokens[accountAddress]).forEach((chainId) => {
        const tokensArray = accountTokens[accountAddress][chainId];
        if (newAllTokens[chainId] === undefined) {
          newAllTokens[chainId] = { [accountAddress]: tokensArray };
        } else {
          newAllTokens[chainId] = {
            ...newAllTokens[chainId],
            [accountAddress]: tokensArray,
          };
        }
      });
    });
  }

  const newAllIgnoredTokens = {};
  if (accountHiddenTokens) {
    Object.keys(accountHiddenTokens).forEach((accountAddress) => {
      Object.keys(accountHiddenTokens[accountAddress]).forEach((chainId) => {
        const ignoredTokensArray = accountHiddenTokens[accountAddress][chainId];
        if (newAllIgnoredTokens[chainId] === undefined) {
          newAllIgnoredTokens[chainId] = {
            [accountAddress]: ignoredTokensArray,
          };
        } else {
          newAllIgnoredTokens[chainId] = {
            ...newAllIgnoredTokens[chainId],
            [accountAddress]: ignoredTokensArray,
          };
        }
      });
    });
  }

  if (state.TokensController) {
    state.TokensController.allTokens = newAllTokens;
    state.TokensController.allIgnoredTokens = newAllIgnoredTokens;
  } else {
    state.TokensController = {
      allTokens: newAllTokens,
      allIgnoredTokens: newAllIgnoredTokens,
    };
  }

  delete state?.PreferencesController?.accountHiddenTokens;
  delete state?.PreferencesController?.accountTokens;
  delete state?.PreferencesController?.assetImages;
  delete state?.PreferencesController?.hiddenTokens;
  delete state?.PreferencesController?.tokens;
  delete state?.PreferencesController?.suggestedTokens;

  return state;
}
