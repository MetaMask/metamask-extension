import { parseAssetID } from './helpers';
import { Route, SWAP_ROUTE } from './route';

export enum BridgeQueryParams {
  /**
   * This is the Caip asset type of the token to bridge or swap from
   */
  From = 'from',
  /**
   * This is the Caip asset type of the token to bridge or swap to
   */
  To = 'to',
  /**
   * This is the amount of the token to bridge or swap from
   */
  Amount = 'amount',
  /**
   * This is a flag to indicate if the swap is from the transaction shield entry modal
   */
  IsFromTransactionShield = 'isFromTransactionShield',
}

export const swap = new Route({
  pathname: '/swap',
  getTitle: (_: URLSearchParams) => 'deepLink_theSwapsPage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();

    const from = params.get(BridgeQueryParams.From);
    const to = params.get(BridgeQueryParams.To);
    const amount = params.get(BridgeQueryParams.Amount);
    // add the params to the query if they exist
    let parsedFrom;
    if (from) {
      parsedFrom = parseAssetID(from);
      if (parsedFrom) {
        query.set(BridgeQueryParams.From, from);
      }
    }
    if (to) {
      const parsedTo = parseAssetID(to);
      if (parsedTo) {
        query.set(BridgeQueryParams.To, to);
      }
    }
    if (amount) {
      query.set(BridgeQueryParams.Amount, amount);
    }

    return {
      path: SWAP_ROUTE,
      query,
    };
  },
});
