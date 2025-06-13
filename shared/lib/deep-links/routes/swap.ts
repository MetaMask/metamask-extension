import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/constants/routes';
import { Route } from './route.type';

export default new Route({
  pathname: '/swap',
  getTitle: (_: URLSearchParams) => 'deepLink_OpenTheSwapsPage',
  handler: function handle(params: URLSearchParams) {
    const query = new URLSearchParams();

    const from = params.get('from');
    const to = params.get('to');
    const amount = params.get('amount');

    // add the params to the query if they exist
    if (from) {
      query.set('from', from);
    }
    if (to) {
      query.set('to', to);
    }
    if (amount) {
      query.set('amount', amount);
    }

    return {
      path: `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`,
      query,
    };
  },
});
