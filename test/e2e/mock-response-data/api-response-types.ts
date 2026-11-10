/**
 * Response types of the APIs mocked for every E2E test, as the wallet code and
 * its controller packages consume them.
 *
 * Mock payloads are annotated with these types, so `yarn lint:tsc` fails when
 * a mock no longer matches what the wallet expects — for example after a
 * package bump adds a required field. Only compose existing types here; never
 * redefine a response shape by hand. See `README.md` in this directory.
 */
import type { MarketDataDetails } from '@metamask/assets-controllers';
import type { UnprocessedRawNotification } from '@metamask/notification-services-controller/notification-services';
import type { Country } from '@metamask/ramps-controller';
import type { ContentfulBannerResponse } from '../../../ui/hooks/useCarouselManagement/fetchCarouselSlidesFromContentful';
// `@metamask/assets-controllers` does not export this from its entry point, so
// it is read from the published declaration file.
import type { DefiPositionResponse } from '../../../node_modules/@metamask/assets-controllers/dist/DeFiPositionsController/fetch-positions';

/** `fetchCarouselSlidesFromContentful` (promotional banners). */
export type ContentfulPromotionalBannersResponse = ContentfulBannerResponse;

/** `GET defiadapters.api.cx.metamask.io/positions/:address` (`buildPositionFetcher` reads `.data`). */
export type DefiPositionsResponse = { data: DefiPositionResponse[] };

/** `POST notification.api.cx.metamask.io/api/v4/notifications` (`getAPINotifications`). */
export type NotificationListResponse = UnprocessedRawNotification[];

/** `GET on-ramp-cache.api.cx.metamask.io/v2/regions/countries` (`RampsService.getCountries`). */
export type RampsCountriesResponse = Country[];

/**
 * One entry of `GET price.api.cx.metamask.io/v3/spot-prices`.
 * `CodefiTokenPricesServiceV2.fetchTokenPrices` spreads it into
 * `MarketDataDetails` and adds `tokenAddress` and `currency` itself.
 */
export type SpotPrice = Omit<MarketDataDetails, 'tokenAddress' | 'currency'>;

export type SpotPricesResponse = Record<string, SpotPrice>;
