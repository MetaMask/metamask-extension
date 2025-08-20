import { Route } from './route';

export enum NonEvmQueryParams {
  CHAIN_ID = 'chainId',
}

const NONEVM_BALANCE_CHECK_ROUTE = 'nonevm-balance-check';

export default new Route({
  pathname: '/nonevm',
  getTitle: (_: URLSearchParams) => 'deepLink_theSwapsRampsPage',
  handler: function handler(params: URLSearchParams) {
    const chainId = params.get(NonEvmQueryParams.CHAIN_ID);

    if (!chainId) {
      throw new Error('Missing chainId parameter');
    }

    const query = new URLSearchParams(params);
    query.set(NonEvmQueryParams.CHAIN_ID, chainId);

    return {
      path: NONEVM_BALANCE_CHECK_ROUTE,
      query,
    };
  },
});
