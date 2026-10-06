// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEVELOPER_OPTIONS_ROUTE } from '../../../../ui/helpers/constants/routes';
import { Route } from './route';

export const test = new Route({
  pathname: '/test',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsPage',
  handler: function handler(params: URLSearchParams) {
    return {
      // we use the developer options route for testing purposes
      // because it doesn't rewrite query params
      path: DEVELOPER_OPTIONS_ROUTE,
      query: params,
    };
  },
});
