import {
  DEFAULT_ROUTE,
  PATH_NAME_MAP,
} from '../../../../ui/helpers/constants/routes';
import type { Route } from './route.type';
export default {
  pathname: '/home',
  getTitle: (_: URLSearchParams) =>
    `Open the ${PATH_NAME_MAP.get(DEFAULT_ROUTE)} Page`,
  handler: function handleHome(_: URLSearchParams) {
    return { path: DEFAULT_ROUTE, query: new URLSearchParams() };
  },
} as Route;
