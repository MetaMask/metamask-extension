import { Mockttp } from 'mockttp';
import {
  ACCOUNT_2,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../constants';

/** Third account from the default E2E SRP (m/44'/60'/0'/0/2). */
export const ACCOUNT_3 = '0x7de4768c33db8785f75075a054aeeed7e01c4497';

const E2E_SRP_EVM_ADDRESSES = [
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  ACCOUNT_2.toLowerCase(),
  ACCOUNT_3.toLowerCase(),
];

/**
 * Mock GET /v5/multiaccount/balances for all default E2E SRP EVM accounts.
 *
 * `addMultichainAccount()` creates Account 2 and Account 3 at runtime; with
 * `assetsUnifyState` enabled their homepage balance comes from the Accounts API,
 * not Anvil. The global mock-e2e handler only serves the default fixture address.
 *
 * @param mockServer - The mock server instance.
 * @param nativeBalanceHuman - Native balance string for each matched account.
 */
export function mockAccountsApiV5ForE2eSrpAccounts(
  mockServer: Mockttp,
  nativeBalanceHuman = '25',
) {
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
        const accountIdLower = accountId.toLowerCase();
        if (
          !E2E_SRP_EVM_ADDRESSES.some((address) =>
            accountIdLower.includes(address),
          )
        ) {
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
          balance: nativeBalanceHuman,
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
