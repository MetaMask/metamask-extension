import { parseAssetID } from './helpers';
import { Route, SWAP_ROUTE } from './route';

export default new Route({
  pathname: '/swap',
  getTitle: (_: URLSearchParams) => 'deepLink_theSwapsPage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();

    const from = params.get('from');
    const to = params.get('to');
    const value = params.get('value');
    // add the params to the query if they exist
    let parsedFrom;
    if (from) {
      parsedFrom = parseAssetID(from);
      if (parsedFrom) {
        query.set('from', from);
      }
    }
    if (to) {
      const parsedTo = parseAssetID(to);
      if (parsedTo) {
        query.set('to', to);
        if (parsedFrom) {
          // if `from` and `to` reference the same chain, add the `swap` param
          // to trigger the "Swap" screen by default
          if (parsedFrom.chainId.id === parsedTo.chainId.id) {
            query.set('swaps', 'true');
          }
        }
      }
    }
    if (value) {
      query.set('value', value);
    }

    return {
      path: SWAP_ROUTE,
      query,
    };
  },
});
