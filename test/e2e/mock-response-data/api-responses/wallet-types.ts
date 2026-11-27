/**
 * The types the wallet reads from these endpoints. A definition checks its
 * fixture with `satisfies`, so `yarn lint:tsc` fails when a sync drops a field
 * the wallet reads.
 */
import type {
  MarketDataDetails,
  TokenListToken,
} from '@metamask/assets-controllers';
import type {
  Eip1559GasFee,
  GasFeeEstimates,
} from '@metamask/gas-fee-controller';
import type { Country, State } from '@metamask/ramps-controller';

export type { ContentfulBannerResponse } from '../../../../ui/hooks/useCarouselManagement/fetchCarouselSlidesFromContentful';
export type { TokenListToken };

/** The live API returns `null` for some fields of newly listed assets. */
export type SpotPrice = {
  [Key in keyof Omit<MarketDataDetails, 'tokenAddress' | 'currency'>]:
    | MarketDataDetails[Key]
    | null;
};

/**
 * The Ramps API sends `states[].supported` as a boolean, while
 * `@metamask/ramps-controller` types it as `{ buy, sell }`. The controller and
 * `rampRegionEligibility` read `supported?.buy`, which is `undefined` here.
 */
export type RampsCountry = Omit<Country, 'states'> & {
  states?: (Omit<State, 'supported'> & { supported?: boolean })[];
};

/** Fields `fetchSwapsGasPrices` validates and reads. */
export type SwapsGasPrices = {
  // The Gas API names these fields.
  /* eslint-disable @typescript-eslint/naming-convention */
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
  /* eslint-enable @typescript-eslint/naming-convention */
};

/** Fields the gas fee controller reads from `suggestedGasFees`. */
export type SuggestedGasFees = Record<
  'low' | 'medium' | 'high',
  Eip1559GasFee
> &
  Pick<GasFeeEstimates, 'estimatedBaseFee' | 'networkCongestion'>;

/** Fields swaps validates (`TOKEN_VALIDATORS`) and shows for each token. */
export type SwapsToken = {
  address: string;
  symbol: string;
  decimals: number | string;
  name: string;
  iconUrl: string;
  aggregators: string[];
  occurrences: number;
};
