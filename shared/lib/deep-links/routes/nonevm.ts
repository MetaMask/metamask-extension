import { Route } from './route';

export enum NonEvmQueryParams {
  ChainId = 'chainId',
}

const NONEVM_BALANCE_CHECK_ROUTE = 'nonevm-balance-check';

export default new Route({
  pathname: '/create-account',
  getTitle: (_: URLSearchParams) => 'deepLink_theSwapsRampsPage',
  handler: function handler(params: URLSearchParams) {
    const chainId = params.get(NonEvmQueryParams.ChainId);

    if (!chainId) {
      throw new Error('Missing chainId parameter');
    }

    const query = new URLSearchParams(params);
    query.set(NonEvmQueryParams.ChainId, chainId);

    return {
      path: NONEVM_BALANCE_CHECK_ROUTE,
      query,
    };
  },
});
