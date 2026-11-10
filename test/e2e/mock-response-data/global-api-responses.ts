/**
 * Small default responses registered by `mock-e2e.js` for every E2E test,
 * typed with the responses the wallet consumes (see `api-response-types.ts`).
 * `sync-api-mocks.ts` rewrites the JSON.
 */
import type {
  ContentfulPromotionalBannersResponse,
  NotificationListResponse,
  RampsCountriesResponse,
} from './api-response-types';
import globalApiResponses from './global-api-responses.fixture.json';

/** No promotional banners, so the carousel only shows local slides. */
export const CONTENTFUL_PROMOTIONAL_BANNERS_EMPTY_RESPONSE: ContentfulPromotionalBannersResponse =
  globalApiResponses.contentful;

/** No notifications, which prevents the unread dot. */
export const NOTIFICATION_LIST_EMPTY_RESPONSE: NotificationListResponse =
  globalApiResponses.notifications;

/** No ramp countries (RampsController.init on startup). */
export const RAMPS_COUNTRIES_EMPTY_RESPONSE: RampsCountriesResponse =
  globalApiResponses.countries;
