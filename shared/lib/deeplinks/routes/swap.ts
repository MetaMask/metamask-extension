import {
  CROSS_CHAIN_SWAP_ROUTE,
  PATH_NAME_MAP,
  PREPARE_SWAP_ROUTE,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/constants/routes';
import type { Route } from './route.type';

export default {
  pathname: '/swap',
  getTitle: (_: URLSearchParams) =>
    `Open the ${PATH_NAME_MAP.get(PREPARE_SWAP_ROUTE)}`,
  // wow. this is the worst lint rule we have. i hate it so much.
  // eslint-disable-next-line func-name-matching
  handler: function handleSwap(_: URLSearchParams) {
    // TODO: handle params
    return {
      path: `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`,
      query: new URLSearchParams(),
    };
  },
} as Route;
