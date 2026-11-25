/**
 * Values supported by the Price API for the `timePeriod` parameter.
 *
 * @see https://price.api.cx.metamask.io/docs#/Historical%20Prices/PriceController_getHistoricalPricesByCaipAssetId
 */
export type PriceApiTimePeriod = `${number}${
  | 'H'
  | 'h'
  | 'D'
  | 'd'
  | 'M'
  | 'm'
  | 'Y'
  | 'y'}`;
