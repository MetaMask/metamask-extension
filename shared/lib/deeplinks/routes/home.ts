import {
  DEFAULT_ROUTE,
  PATH_NAME_MAP,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/constants/routes';
import type { Route } from './route.type';

export default {
  pathname: '/home',
  getTitle: (_: URLSearchParams) =>
    `Open the ${PATH_NAME_MAP.get(DEFAULT_ROUTE)} Page`,
  // wow. this is the worst lint rule we have. i hate it so much.
  // eslint-disable-next-line func-name-matching
  handler: function handleHome(_: URLSearchParams) {
    return { path: DEFAULT_ROUTE, query: new URLSearchParams() };
  },
} as Route;
