/**
 * The response types the wallet code expects from each API covered by the
 * E2E API mock contracts.
 *
 * Every entry must reuse the type that the consuming code (wallet code or a
 * controller package) actually relies on, so that bumping a package or
 * changing the wallet code automatically changes what the mocks are checked
 * against. Only compose existing types here; never redefine a response shape.
 *
 * See `README.md` in this directory.
 */
import type { MarketDataDetails } from '@metamask/assets-controllers';
import type { UnprocessedRawNotification } from '@metamask/notification-services-controller/notification-services';
import type { Country } from '@metamask/ramps-controller';
import type { ContentfulBannerResponse } from '../../../ui/hooks/useCarouselManagement/fetchCarouselSlidesFromContentful';
// `@metamask/assets-controllers` does not export these from its entry point,
// so they are read from the published declaration files.
import type { DefiPositionResponse } from '../../../node_modules/@metamask/assets-controllers/dist/DeFiPositionsController/fetch-positions';
import type { fetchSupportedNetworks } from '../../../node_modules/@metamask/assets-controllers/dist/token-prices-service/codefi-v2';

/**
 * `CodefiTokenPricesServiceV2.fetchTokenPrices` spreads each entry of the
 * `/v3/spot-prices` response into `MarketDataDetails`, then adds
 * `tokenAddress` and `currency` itself.
 */
export type PriceApiV3SpotPrice = Omit<
  MarketDataDetails,
  'tokenAddress' | 'currency'
>;

export type ApiConsumerTypes = {
  /** `fetchCarouselSlidesFromContentful` (ui/hooks/useCarouselManagement). */
  contentfulPromotionalBanners: ContentfulBannerResponse;
  /** `buildPositionFetcher` reads `.data` (DeFiPositionsController). */
  defiAdaptersPositions: { data: DefiPositionResponse[] };
  /** `getAPINotifications` (NotificationServicesController). */
  notificationApiV4List: UnprocessedRawNotification[];
  /** `fetchTokenPrices` (CodefiTokenPricesServiceV2). */
  priceApiV3SpotPrices: Record<string, PriceApiV3SpotPrice>;
  /** `fetchSupportedNetworks` (CodefiTokenPricesServiceV2). */
  priceApiV2SupportedNetworks: Awaited<
    ReturnType<typeof fetchSupportedNetworks>
  >;
  /** `RampsService.getCountries` (RampsController). */
  rampsRegionsCountries: Country[];
};

export type ApiConsumerTypeName = keyof ApiConsumerTypes;
