import { parseAssetID } from './helpers';
import { Route, SWAP_ROUTE } from './route';

export enum BridgeQueryParams {
  AMOUNT = 'amount',
  /**
   * This is the Caip asset type of the token to bridge or swap from
   */
  FROM = 'from',
  /**
   * This is the Caip asset type of the token to bridge or swap to
   */
  TO = 'to',
  /**
   * This is the amount of the token to bridge or swap from
   */
}

export default new Route({
  pathname: '/swap',
  getTitle: (_: URLSearchParams) => 'deepLink_theSwapsPage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();

    const from = params.get(BridgeQueryParams.FROM);
    const to = params.get(BridgeQueryParams.TO);
    const amount = params.get(BridgeQueryParams.AMOUNT);
    // add the params to the query if they exist
    let parsedFrom;
    if (from) {
      parsedFrom = parseAssetID(from);
      if (parsedFrom) {
        query.set(BridgeQueryParams.FROM, from);
      }
    }
    if (to) {
      const parsedTo = parseAssetID(to);
      if (parsedTo) {
        query.set(BridgeQueryParams.TO, to);
      }
    }
    if (amount) {
      query.set(BridgeQueryParams.AMOUNT, amount);
    }

    return {
      path: SWAP_ROUTE,
      query,
    };
  },
});
