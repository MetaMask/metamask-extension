import {
  NOTIFICATIONS_ROUTE,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/constants/routes';
import { Route } from './route';

export default new Route({
  pathname: '/notifications',
  getTitle: (_: URLSearchParams) => 'deepLink_theNotificationsPage',
  handler: function handler(_: URLSearchParams) {
    return { path: NOTIFICATIONS_ROUTE, query: new URLSearchParams() };
  },
});
