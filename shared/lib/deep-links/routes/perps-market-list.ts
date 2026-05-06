import {
  VALID_MARKET_FILTERS,
  type MarketFilter,
} from '../../../constants/perps';
import { PERPS_MARKET_LIST_ROUTE, Route } from './route';

export enum PerpsMarketListQueryParams {
  Filter = 'filter',
}

export const perpsMarketList = new Route({
  pathname: '/perps/market-list',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsMarketListPage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();
    const filter = params.get(PerpsMarketListQueryParams.Filter);

    if (filter && VALID_MARKET_FILTERS.includes(filter as MarketFilter)) {
      query.set(PerpsMarketListQueryParams.Filter, filter);
    }

    return { path: PERPS_MARKET_LIST_ROUTE, query };
  },
});
