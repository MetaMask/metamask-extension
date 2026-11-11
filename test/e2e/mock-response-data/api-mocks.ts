import type { MarketDataDetails } from '@metamask/assets-controllers';
import type { Country } from '@metamask/ramps-controller';
import type { ContentfulBannerResponse } from '../../../ui/hooks/useCarouselManagement/fetchCarouselSlidesFromContentful';
// Not exported from the package entry point.
import type { DefiPositionResponse } from '../../../node_modules/@metamask/assets-controllers/dist/DeFiPositionsController/fetch-positions';
import fixtures from './api-fixtures.json';
import { placeholder, type Json } from './sync-api-mocks';

export type DefiPositionsResponse = { data: DefiPositionResponse[] };

/** The live API returns `null` for some fields of newly listed assets. */
type SpotPrice = {
  [Key in keyof Omit<MarketDataDetails, 'tokenAddress' | 'currency'>]:
    | MarketDataDetails[Key]
    | null;
};

/**
 * Mocks written by `yarn test:e2e:sync-api-mocks`. `yarn lint:tsc` fails when
 * a synced shape no longer matches the type the wallet reads.
 */
export const API_MOCKS: typeof fixtures & {
  contentful: ContentfulBannerResponse;
  'ramps-countries': Country[];
  'price-v3-spot': Record<string, SpotPrice>;
} = fixtures;

export const SPOT_PRICE_FALLBACK = placeholder(
  API_MOCKS['price-v3-spot']['eip155:1/slip44:60'],
);

/**
 * Applies the values tests assert over a synced mock. Nested objects merge, so
 * fields a sync added are kept; arrays and scalars in `pins` win.
 *
 * @param mock - The synced mock.
 * @param pins - Values the tests depend on.
 * @returns The mock with `pins` applied.
 */
export function withPins(mock: Json, pins: Json): Json {
  if (
    pins === null ||
    typeof pins !== 'object' ||
    Array.isArray(pins) ||
    mock === null ||
    typeof mock !== 'object' ||
    Array.isArray(mock)
  ) {
    return pins;
  }
  const merged = { ...mock };
  for (const [key, value] of Object.entries(pins)) {
    merged[key] = withPins(mock[key], value);
  }
  return merged;
}
