import { Mockttp } from 'mockttp';

import { DEFAULT_FIXTURE_ACCOUNT_LOWERCASE } from '../../../constants';

/**
 * Mock GET /v2/supportedNetworks for the Accounts API.
 *
 * Lists **EVM** chains only. Solana balances in these E2E flows come from mocked
 * Solana RPC (`getBalance` via `mockSolanaBalanceQuote` in `common-solana.ts`),
 * same as `check-balance.spec.ts`. Marking Solana as accounts-API
 * `fullSupport` can route balance through v5 paths that are not used for Solana
 * here and can prevent **50 SOL** from rendering.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV2SupportedNetworks(mockServer: Mockttp) {
  return mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .always()
    .thenJson(200, {
      fullSupport: [
        'eip155:1',
        'eip155:137',
        'eip155:56',
        'eip155:59144',
        'eip155:8453',
        'eip155:10',
        'eip155:42161',
        'eip155:534352',
        'eip155:1337',
      ],
      partialSupport: ['eip155:42220', 'eip155:43114'],
    });
}

/**
 * Mock GET /v5/multiaccount/balances for the Accounts API (**EVM only**).
 *
 * Seeds localhost ETH for `loginWithBalanceValidation` when no Anvil node runs.
 * Solana SOL/USDC balances are **not** returned here; they come from Solana RPC mocks.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV5MultiaccountBalances(mockServer: Mockttp) {
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
    {
      accountId: `eip155:1:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
      assetId: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      balance: '1000',
    },
    {
      accountId: `eip155:1:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
      assetId: 'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7',
      balance: '1000',
    },
  ];

  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
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
