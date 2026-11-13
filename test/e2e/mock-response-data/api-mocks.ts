import type {
  MarketDataDetails,
  TokenListToken,
} from '@metamask/assets-controllers';
import type {
  Eip1559GasFee,
  GasFeeEstimates,
} from '@metamask/gas-fee-controller';
import type { Country, State } from '@metamask/ramps-controller';
import { isPlainObject, mergeWith } from 'lodash';
import type { ContentfulBannerResponse } from '../../../ui/hooks/useCarouselManagement/fetchCarouselSlidesFromContentful';
import fixtures from './api-fixtures.json';
import { placeholder, type Json } from './sync-api-mocks';

/**
 * `@metamask/assets-controllers` does not export `DefiPositionResponse`. This
 * is the part of it the DeFi positions controller reads.
 */
type DefiBalance = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balanceRaw: string;
  balance: number;
  price?: number;
  tokens?: (DefiBalance & {
    type: 'underlying' | 'underlying-claimable';
    iconUrl: string;
  })[];
};

type DefiProtocolDetails = {
  chainId: number;
  chainName: string;
  protocolId: string;
  productId: string;
  protocolDisplayName: string;
  name: string;
  description: string;
  iconUrl: string;
  siteUrl: string;
  positionType: 'supply' | 'borrow' | 'stake' | 'reward';
  metadata?: { groupPositions?: boolean };
};

type DefiPositionResponse =
  | (DefiProtocolDetails & {
      success: true;
      tokens: (DefiBalance & { type: 'protocol'; tokenId?: string })[];
    })
  | (DefiProtocolDetails & { success: false; error: { message: string } })
  | { success: false; error: { message: string } };

export type DefiPositionsResponse = { data: DefiPositionResponse[] };

/** The live API returns `null` for some fields of newly listed assets. */
type SpotPrice = {
  [Key in keyof Omit<MarketDataDetails, 'tokenAddress' | 'currency'>]:
    | MarketDataDetails[Key]
    | null;
};

/**
 * The Ramps API sends `states[].supported` as a boolean, while
 * `@metamask/ramps-controller` types it as `{ buy, sell }`. The controller and
 * `rampRegionEligibility` read `supported?.buy`, which is `undefined` here.
 */
type RampsCountry = Omit<Country, 'states'> & {
  states?: (Omit<State, 'supported'> & { supported?: boolean })[];
};

/** Fields `fetchSwapsGasPrices` validates and reads. */
type SwapsGasPrices = {
  // The Gas API names these fields.
  /* eslint-disable @typescript-eslint/naming-convention */
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
  /* eslint-enable @typescript-eslint/naming-convention */
};

/** Fields the gas fee controller reads from `suggestedGasFees`. */
type SuggestedGasFees = Record<'low' | 'medium' | 'high', Eip1559GasFee> &
  Pick<GasFeeEstimates, 'estimatedBaseFee' | 'networkCongestion'>;

/** Fields swaps validates (`TOKEN_VALIDATORS`) and shows for each token. */
type SwapsToken = {
  address: string;
  symbol: string;
  decimals: number | string;
  name: string;
  iconUrl: string;
  aggregators: string[];
  occurrences: number;
};

/**
 * Mocks written by `yarn test:e2e:sync-api-mocks`. `yarn lint:tsc` fails when
 * a synced shape no longer matches the type the wallet reads. A list that
 * would otherwise be empty keeps one placeholder element, so its type is
 * checked; `mock-e2e.js` serves the list without it.
 */
export const API_MOCKS: typeof fixtures & {
  contentful: ContentfulBannerResponse;
  'ramps-countries': RampsCountry[];
  'price-v3-spot': Record<string, SpotPrice>;
  'gas-prices': SwapsGasPrices;
  'suggested-gas-fees': SuggestedGasFees;
  'token-list': TokenListToken[];
  'bridge-tokens': SwapsToken[];
  'bridge-tokens-linea': SwapsToken[];
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
  if (!isPlainObject(mock) || !isPlainObject(pins)) {
    return pins;
  }
  return mergeWith({}, mock, pins, (_existing: Json, pinned: Json) =>
    Array.isArray(pinned) ? pinned : undefined,
  );
}
