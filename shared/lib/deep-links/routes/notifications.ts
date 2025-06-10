import {
  NOTIFICATIONS_ROUTE,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/constants/routes';
import { Route } from './route.type';

export default new Route({
  pathname: '/notifications',
  getTitle: (_: URLSearchParams) => 'deepLink_OpenTheNotifications',
  // wow. this is the worst lint rule we have. i hate it so much.
  // eslint-disable-next-line func-name-matching
  handler: function handleNotifications(_: URLSearchParams) {
    return { path: NOTIFICATIONS_ROUTE, query: new URLSearchParams() };
  },
});
