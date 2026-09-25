import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 56;

/**
 * Remove tokens that don't have an address due to
 * lack of previous addToken validation.  Also removes
 * an unwanted, undefined image property
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;

    const { PreferencesController } = (versionedData.data ?? {}) as LegacyState;

    if (Array.isArray(PreferencesController?.tokens)) {
      PreferencesController.tokens = PreferencesController.tokens.filter(
        ({ address }) => address,
      );
    }

    const accountTokens = PreferencesController?.accountTokens;
    if (accountTokens && typeof accountTokens === 'object') {
      Object.keys(accountTokens).forEach((account) => {
        const chains = Object.keys(accountTokens[account]);
        chains.forEach((chain) => {
          accountTokens[account][chain] = accountTokens[account][chain].filter(
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
} satisfies LegacyMigration;
