/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 56;

/**
 * Remove tokens that don't have an address due to
 * lack of previous addToken validation.  Also removes
 * an unwanted, undefined image property
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;

    const { PreferencesController } = (versionedData.data ?? {}) as LegacyState;

    if (Array.isArray(PreferencesController?.tokens)) {
      PreferencesController.tokens = PreferencesController.tokens.filter(
        ({ address }) => address,
      );
    }

    if (
      PreferencesController?.accountTokens &&
      typeof PreferencesController.accountTokens === 'object'
    ) {
      Object.keys(PreferencesController.accountTokens).forEach((account) => {
        const chains = Object.keys(
          PreferencesController.accountTokens[account],
        );
        chains.forEach((chain) => {
          PreferencesController.accountTokens[account][chain] =
            PreferencesController.accountTokens[account][chain].filter(
              ({ address }) => address,
            );
        });
      });
    }

    if (
      PreferencesController?.assetImages &&
      'undefined' in PreferencesController.assetImages
    ) {
      delete PreferencesController.assetImages.undefined;
    }

    return versionedData;
  },
};

export default migration;
