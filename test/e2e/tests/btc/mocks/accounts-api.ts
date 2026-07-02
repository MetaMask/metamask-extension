import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../../constants';
import { BTC_CHAIN_ID } from './bridge';

const BTC_CAIP_ASSET_ID = `${BTC_CHAIN_ID}/slip44:0`;
const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

/**
 * Mock GET /v2/supportedNetworks for the Accounts API.
 *
 * Includes Bitcoin so AccountsApiDataSource serves BTC balances via the v5 API
 * when `assetsUnifyState` is enabled (instead of the Snap esplora polling path,
 * which unified selectors no longer read for the homepage asset list).
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV2WithBtc(mockServer: Mockttp) {
  return mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .asPriority(99)
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
        BTC_CHAIN_ID,
        SOLANA_CHAIN_ID,
      ],
      partialSupport: { balances: [42220, 43114] },
    });
}

/**
 * Mock GET /v5/multiaccount/balances for the Accounts API.
 *
 * Returns native BTC for the E2E Bitcoin address plus default EVM localhost ETH.
 * AccountsApiDataSource maps by address (not account UUID), so this works
 * regardless of which runtime account ID the Bitcoin Snap creates.
 *
 * @param mockServer - The mock server instance.
 * @param btcBalanceHuman - Human-readable BTC balance (default 1).
 */
export function mockAccountsApiV5WithBtc(
  mockServer: Mockttp,
  btcBalanceHuman: string = String(DEFAULT_BTC_BALANCE),
) {
  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .asPriority(99)
    .always()
    .thenCallback((req) => {
      const accountIds =
        new URL(req.url).searchParams
          .get('accountIds')
          ?.split(',')
          .filter(Boolean) ?? [];

      const balances = [];

      for (const accountId of accountIds) {
        if (
          accountId.startsWith('bip122:') &&
          accountId.includes(DEFAULT_BTC_ADDRESS)
        ) {
          balances.push({
            accountId,
            assetId: BTC_CAIP_ASSET_ID,
            balance: btcBalanceHuman,
          });
          continue;
        }

        if (
          accountId.toLowerCase().includes(DEFAULT_FIXTURE_ACCOUNT_LOWERCASE)
        ) {
          const chainRef = accountId.split(':')[1] ?? '1';
          const slip44 = chainRef === '1337' ? '1' : '60';
          balances.push({
            accountId,
            assetId: `eip155:${chainRef}/slip44:${slip44}`,
            balance: '25',
          });
        }
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
