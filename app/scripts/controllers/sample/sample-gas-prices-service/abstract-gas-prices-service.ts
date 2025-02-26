import type { PublicInterface } from '@metamask/utils';

import type { SampleGasPricesService } from './sample-gas-prices-service';

/**
 * A service object which is responsible for fetching gas prices.
 */
export type AbstractGasPricesService = PublicInterface<SampleGasPricesService>;
