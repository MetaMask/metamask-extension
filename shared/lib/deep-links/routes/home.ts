import {
  DEFAULT_ROUTE,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/constants/routes';
import { Route } from './route.type';

export default new Route({
  pathname: '/home',
  getTitle: (_: URLSearchParams) => `Open the Home Page`,
  // wow. this is the worst lint rule we have. i hate it so much.
  // eslint-disable-next-line func-name-matching
  handler: function handleHome(_: URLSearchParams) {
    return { path: DEFAULT_ROUTE, query: new URLSearchParams() };
  },
});
