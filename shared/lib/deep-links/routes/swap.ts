import { parseAssetID } from './helpers';
import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route, SWAP_ROUTE } from './route';

export const LIMIT_ORDER_TAB = 'limit';

export enum BridgeQueryParams {
  /**
   * This is the order type to open.
   */
  Tab = 'tab',
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
    if (params.get(BridgeQueryParams.Tab) === LIMIT_ORDER_TAB) {
      const deeplinkUrl = new URL('/swap', DEEP_LINK_ORIGIN);
      params.forEach((value, key) =>
        deeplinkUrl.searchParams.append(key, value),
      );

      return createHomeQrCodeDestination(
        HomeQueryParams.LimitOrderDeeplinkUrl,
        deeplinkUrl.toString(),
      );
    }

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
