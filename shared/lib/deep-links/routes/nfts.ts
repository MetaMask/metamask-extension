import { AccountOverviewTabKey } from '../../../constants/app-state';
// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEFAULT_ROUTE } from '../../../../ui/helpers/constants/routes';
import { Route } from './route';

export const nfts = new Route({
  pathname: '/nft',
  getTitle: (_: URLSearchParams) => 'deepLink_theNFTsPage',
  handler: function handler(_: URLSearchParams) {
    const query = new URLSearchParams();
    query.set('tab', AccountOverviewTabKey.Nfts);
    return { path: DEFAULT_ROUTE, query };
  },
});
