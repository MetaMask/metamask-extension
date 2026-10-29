import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 226;

/**
 * Moves install-time GA cookie traits from MetaMetricsController.traits onto
 * AppMetadataController.installAttribution, then deletes
 * MetaMetricsController.traits.
 *
 * `install_date_ext` is discarded: UserTraitsService now derives it from
 * AppMetadataController.firstTimeInfo.date. `storage_kind` is read from
 * PersistenceManager at identify time.
 *
 * Marketing fields (`dataCollectionForMarketing`, `marketingCampaignCookieId`)
 * remain on MetaMetricsController in this migration.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (
    !hasProperty(data, 'MetaMetricsController') ||
    !isObject(data.MetaMetricsController)
  ) {
    return;
  }

  const metaMetricsController = data.MetaMetricsController as Record<
    string,
    unknown
  >;

  if (!hasProperty(metaMetricsController, 'traits')) {
    return;
  }

  if (
    !hasProperty(data, 'AppMetadataController') ||
    !isObject(data.AppMetadataController)
  ) {
    data.AppMetadataController = {};
  }

  const appMetadataController = data.AppMetadataController as Record<
    string,
    unknown
  >;

  if (isObject(metaMetricsController.traits)) {
    const { traits } = metaMetricsController;
    if (
      hasProperty(traits, 'cookie_id') &&
      typeof traits.cookie_id === 'string'
    ) {
      const installAttribution: { cookieId: string; gaClientId?: string } = {
        cookieId: traits.cookie_id,
      };
      if (
        hasProperty(traits, 'ga_client_id') &&
        typeof traits.ga_client_id === 'string'
      ) {
        installAttribution.gaClientId = traits.ga_client_id;
      }
      appMetadataController.installAttribution = installAttribution;
    }
  }

  delete metaMetricsController.traits;

  changedControllers.add('MetaMetricsController');
  changedControllers.add('AppMetadataController');
}) satisfies Migrate;
