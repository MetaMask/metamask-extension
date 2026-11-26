import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import type { Migrate } from './types';

export const version = 239;

/**
 * Whether the legacy pending choice may replace the current analytics state.
 *
 * Mirrors `AnalyticsController.applyRemoteMarketingConsent`: a choice still
 * waiting to be saved wins, and a value matching the decision already made
 * changes nothing.
 *
 * @param analyticsState - The persisted AnalyticsController state.
 * @param pendingConsent - The legacy pending marketing consent.
 * @returns Whether the legacy value should be adopted.
 */
function shouldAdoptPendingConsent(
  analyticsState: Record<string, unknown>,
  pendingConsent: boolean,
): boolean {
  if (analyticsState.marketingConsentSyncPending === true) {
    return false;
  }

  if (analyticsState.marketingConsentDecisionMade !== true) {
    return true;
  }

  return analyticsState.optedInToMarketing === pendingConsent;
}

/**
 * Migration 239: carry an unsent marketing consent choice from the
 * `MarketingConsentController` preview builds into `AnalyticsController`.
 *
 * `MarketingConsentController` never shipped in a release. Its persisted
 * `pendingMarketingConsent` is the only state `MarketingConsentSyncService`
 * cannot reconstruct, so a pending `true` or `false` is written to the
 * Analytics fields the service reads. Consent stays decided, so no consent
 * prompt reappears.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (!hasProperty(data, 'MarketingConsentController')) {
    return;
  }

  const legacyState = data.MarketingConsentController;

  if (!isObject(legacyState)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid MarketingConsentController state: '${typeof legacyState}'`,
      ),
    );
    delete data.MarketingConsentController;
    changedControllers.add('MarketingConsentController');
    return;
  }

  const pendingConsent = hasProperty(legacyState, 'pendingMarketingConsent')
    ? legacyState.pendingMarketingConsent
    : undefined;

  if (typeof pendingConsent === 'boolean') {
    const analyticsState =
      hasProperty(data, 'AnalyticsController') &&
      isObject(data.AnalyticsController)
        ? (data.AnalyticsController as Record<string, unknown>)
        : {};

    if (shouldAdoptPendingConsent(analyticsState, pendingConsent)) {
      const nextAnalyticsState: Record<string, unknown> = {
        ...analyticsState,
        optedInToMarketing: pendingConsent,
        marketingConsentDecisionMade: true,
        marketingConsentSyncPending: true,
      };

      // `AnalyticsController#optOutOfMarketing` clears the campaign cookie id.
      if (!pendingConsent) {
        nextAnalyticsState.marketingCampaignCookieId = null;
      }

      data.AnalyticsController = nextAnalyticsState;
      changedControllers.add('AnalyticsController');
    }
  }

  delete data.MarketingConsentController;
  changedControllers.add('MarketingConsentController');
}) satisfies Migrate;
