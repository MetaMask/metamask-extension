import { AccountOverviewTabKey } from '../../../constants/app-state';
import { DEFAULT_ROUTE, Route } from './route';

export default new Route({
  pathname: '/nft',
  getTitle: (_: URLSearchParams) => 'deepLink_theNFTsPage',
  handler: function handler(_: URLSearchParams) {
    const query = new URLSearchParams();
    query.set('tab', AccountOverviewTabKey.Nfts);
    return { path: DEFAULT_ROUTE, query };
  },
});
