import { Mockttp } from 'mockttp';

import { DEFAULT_FIXTURE_ACCOUNT_LOWERCASE } from '../../constants';

/**
 * EVM-only GET /v2/supportedNetworks for the Accounts API.
 *
 * Non-EVM chains (Bitcoin, Solana, Tron, …) must **not** appear in
 * `fullSupport`; otherwise AssetsController routes them through
 * AccountsApiDataSource instead of SnapDataSource. Snap-backed E2E flows
 * should mock chain RPC (Infura, TronGrid, esplora, Solana RPC, etc.).
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV2EvmOnlySupportedNetworks(
  mockServer: Mockttp,
) {
  return mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .asPriority(99)
    .always()
    .thenJson(200, {
      fullSupport: [1, 137, 56, 59144, 8453, 10, 42161, 534352, 1337],
      partialSupport: { balances: [42220, 43114] },
    });
}

/**
 * EVM-only GET /v5/multiaccount/balances for the Accounts API.
 *
 * Seeds localhost/mainnet ETH for `loginWithBalanceValidation`. Snap chain
 * balances are intentionally omitted so SnapDataSource + RPC mocks apply.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV5EvmOnlyBalances(mockServer: Mockttp) {
  const balances = [
    {
      accountId: `eip155:1337:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
      assetId: 'eip155:1337/slip44:1',
      balance: '25',
    },
    {
      accountId: `eip155:1:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
      assetId: 'eip155:1/slip44:60',
      balance: '25',
    },
  ];

  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .asPriority(99)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: balances.length,
        unprocessedNetworks: [],
        balances,
      },
    }));
}
