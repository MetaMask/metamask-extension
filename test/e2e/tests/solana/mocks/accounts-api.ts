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
        1,
        137,
        56,
        59144,
        8453,
        10,
        42161,
        534352,
        1337,
      ],
      partialSupport: { balances: [42220, 43114] },
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
      assetId: 'eip155:1337/slip44:60',
      balance: '25',
    },
  ];

  return mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u)
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
