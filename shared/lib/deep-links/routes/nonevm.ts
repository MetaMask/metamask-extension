import { Route } from './route';

export enum NonEvmChainType {
  SOLANA = 'solana',
  BITCOIN = 'bitcoin',
  TRON = 'tron',
}

export enum NonEvmQueryParams {
  CHAIN_ID = 'chainId',
}

export const NONEVM_BALANCE_CHECK_ROUTE = 'nonevm-balance-check';

export default new Route({
  pathname: '/nonevm',
  getTitle: (_: URLSearchParams) => 'deepLink_theNonEvmPage',
  handler: function handler(params: URLSearchParams) {
    const chainId = params.get(NonEvmQueryParams.CHAIN_ID)?.toLowerCase();

    // Validate chain type
    if (!chainId || !Object.values(NonEvmChainType).includes(chainId as NonEvmChainType)) {
      throw new Error(`Unsupported chain type: ${chainId}`);
    }

    const query = new URLSearchParams(params);
    query.set(NonEvmQueryParams.CHAIN_ID, chainId);

    // Route to the dedicated component that will check balances and redirect
    return {
      path: NONEVM_BALANCE_CHECK_ROUTE,
      query,
    };
  },
});
