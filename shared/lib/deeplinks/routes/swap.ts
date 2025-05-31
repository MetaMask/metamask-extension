import {
  CROSS_CHAIN_SWAP_ROUTE,
  PATH_NAME_MAP,
  PREPARE_SWAP_ROUTE,
} from '../../../../ui/helpers/constants/routes';
import type { Route } from './route.type';
export default {
  pathname: '/swap',
  getTitle: (_: URLSearchParams) =>
    `Open the ${PATH_NAME_MAP.get(PREPARE_SWAP_ROUTE)}`,
  handler: function handleHome(params: URLSearchParams) {
    // TODO: handle params
    return {
      path: `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`,
      query: new URLSearchParams(),
    };
  },
} as Route;
