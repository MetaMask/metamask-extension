/**
 * Messenger config for CurrencyRateDataService — UI-exposed events.
 *
 * Uses `DataServiceEvents` from `@metamask-previews/base-data-service`
 * (core PR #8039). `BaseDataService` auto-publishes `cacheUpdate` events
 * when the background QueryClient cache changes — no manual publish needed.
 */
import type { DataServiceEvents } from '@metamask-previews/base-data-service';

const serviceName = 'CurrencyRateDataService';

export const UI_EVENTS = [`${serviceName}:cacheUpdate`] as const;

export type UIEvents = DataServiceEvents<typeof serviceName>;
