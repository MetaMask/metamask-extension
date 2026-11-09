/**
 * Small default responses registered by `mock-e2e.js` for every E2E test.
 * Kept here so the E2E API mock contracts can check them against the types
 * the wallet expects (see `test/e2e/api-contracts`).
 */
import type { ApiConsumerTypes } from '../api-contracts/consumer-types';

/** No promotional banners, so the carousel only shows local slides. */
export const CONTENTFUL_PROMOTIONAL_BANNERS_EMPTY_RESPONSE: ApiConsumerTypes['contentfulPromotionalBanners'] =
  {
    items: [],
    includes: { Asset: [] },
  };

/** No notifications, which prevents the unread dot. */
export const NOTIFICATION_API_V4_LIST_EMPTY_RESPONSE: ApiConsumerTypes['notificationApiV4List'] =
  [];

/** No ramp countries (RampsController.init on startup). */
export const RAMPS_REGIONS_COUNTRIES_EMPTY_RESPONSE: ApiConsumerTypes['rampsRegionsCountries'] =
  [];
