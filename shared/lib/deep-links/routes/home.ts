import {
  DEFAULT_ROUTE,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/constants/routes';
import { Route } from './route.type';

export default new Route({
  pathname: '/home',
  getTitle: (_: URLSearchParams) => 'deepLink_OpenTheHomePage',
  handler: function handle(_: URLSearchParams) {
    return { path: DEFAULT_ROUTE, query: new URLSearchParams() };
  },
});
