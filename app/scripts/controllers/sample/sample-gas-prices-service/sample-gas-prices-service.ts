import type { Hex } from '@metamask/utils';

/**
 * What the API endpoint returns.
 */
type GasPricesResponse = {
  data: {
    low: number;
    average: number;
    high: number;
  };
};

/**
 * This service object is responsible for fetching gas prices via an API.
 *
 * @example
 *
 * On its own:
 *
 * ``` ts
 * const gasPricesService = new SampleGasPricesService({ fetch });
 * // Fetch gas prices for Mainnet
 * const gasPricesResponse = await gasPricesService.fetchGasPrices('0x1');
 * // ... Do something with the response ...
 * ```
 *
 * In conjunction with `SampleGasPricesController`:
 *
 * ``` ts
 * const gasPricesService = new SampleGasPricesService({ fetch });
 * const gasPricesController = new SampleGasPricesController({
 *   // ... state, messenger, etc. ...
 *   gasPricesService,
 * });
 * // This will use the service object internally
 * gasPricesController.updateGasPrices();
 * ```
 */
export class SampleGasPricesService {
  readonly #fetch: typeof fetch;

  /**
   * Constructs a new SampleGasPricesService object.
   *
   * @param args - The arguments.
   * @param args.fetch - A function that can be used to make an HTTP request.
   * If your JavaScript environment supports `fetch` natively, you'll probably
   * want to pass that; otherwise you can pass an equivalent (such as `fetch`
   * via `node-fetch`).
   */
  constructor({ fetch: fetchFunction }: { fetch: typeof fetch }) {
    this.#fetch = fetchFunction;
  }

  /**
   * Makes a request to the API in order to retrieve gas prices for a particular
   * chain.
   *
   * @param chainId - The chain ID for which you want to fetch gas prices.
   * @returns The gas prices for the given chain.
   */
  async fetchGasPrices(chainId: Hex) {
    const response = await this.#fetch(
      `https://example.com/gas-prices/${chainId}.json`,
    );
    // Type assertion: We have to assume the shape of the response data.
    const gasPricesResponse =
      (await response.json()) as unknown as GasPricesResponse;
    return gasPricesResponse.data;
  }
}
