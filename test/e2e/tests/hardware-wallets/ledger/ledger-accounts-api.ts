import { Mockttp } from 'mockttp';
import { TREZOR_ADDRESS } from '../../../constants';
import { LEDGER_LARGE_ETH_BALANCE_HUMAN } from './ledger-unified-assets-fixture';

const LEDGER_ADDRESS = TREZOR_ADDRESS.toLowerCase();

/**
 * Mock GET /v5/multiaccount/balances for the Ledger hardware wallet account.
 *
 * With `assetsUnifyState` enabled the homepage balance for the selected Ledger
 * account is served via Accounts API v5, not Anvil `setAccountBalance`.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV5ForLedgerAccount(mockServer: Mockttp) {
  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .asPriority(99)
    .always()
    .thenCallback((req) => {
      const accountIds =
        new URL(req.url).searchParams.get('accountIds')?.split(',') ?? [];

      const balances = [];

      for (const accountId of accountIds) {
        if (!accountId.toLowerCase().includes(LEDGER_ADDRESS)) {
          continue;
        }

        const parts = accountId.split(':');
        if (parts[0] !== 'eip155' || parts.length < 3) {
          continue;
        }

        const chainRef = parts[1];
        const slip44 = chainRef === '1337' ? '1' : '60';
        balances.push({
          accountId,
          assetId: `eip155:${chainRef}/slip44:${slip44}`,
          balance: LEDGER_LARGE_ETH_BALANCE_HUMAN,
        });
      }

      return {
        statusCode: 200,
        json: {
          count: balances.length,
          balances,
          unprocessedNetworks: [],
        },
      };
    });
}
