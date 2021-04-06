import { cloneDeep } from 'lodash';

const version = 56;

/**
 * Remove tokens that don't have an address due to
 * lack of previous addToken validation.  Also removes
 * an unwanted, undefined image property
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;

    const { PreferencesController } = versionedData.data;

    if (Array.isArray(PreferencesController.tokens)) {
      PreferencesController.tokens = PreferencesController.tokens.filter(
        ({ address }) => address,
      );
    }

    if (
      PreferencesController.accountTokens &&
      typeof PreferencesController.accountTokens === 'object'
    ) {
      Object.keys(PreferencesController.accountTokens).forEach((account) => {
        const chains = Object.keys(
          PreferencesController.accountTokens[account],
        );
        chains.forEach((chain) => {
          PreferencesController.accountTokens[account][
            chain
          ] = PreferencesController.accountTokens[account][chain].filter(
            ({ address }) => address,
          );
        });
      });
    }

    if (
      PreferencesController.assetImages &&
      'undefined' in PreferencesController.assetImages
    ) {
      delete PreferencesController.assetImages.undefined;
    }

    return versionedData;
  },
};
