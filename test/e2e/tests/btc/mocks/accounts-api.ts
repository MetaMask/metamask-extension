import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../../constants';
import { BTC_CHAIN_ID } from './bridge';

const BTC_CAIP_ASSET_ID = `${BTC_CHAIN_ID}/slip44:0`;

/**
 * Mock GET /v2/supportedNetworks for the Accounts API.
 *
 * Includes Bitcoin so AccountsApiDataSource serves BTC balances via the v5 API
 * when `assetsUnifyState` is enabled.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV2WithBtc(mockServer: Mockttp) {
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
        BTC_CHAIN_ID,
      ],
      partialSupport: { balances: [42220, 43114] },
    });
}

/**
 * Mock GET /v5/multiaccount/balances with BTC for the default E2E address.
 *
 * The AccountsApiDataSource maps by address (not account UUID), so this works
 * regardless of which runtime account ID the Bitcoin Snap creates.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV5WithBtc(mockServer: Mockttp) {
  const balances = [
    {
      accountId: `eip155:1337:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
      assetId: 'eip155:1337/slip44:1',
      balance: '25',
    },
    {
      accountId: `${BTC_CHAIN_ID}:${DEFAULT_BTC_ADDRESS}`,
      assetId: BTC_CAIP_ASSET_ID,
      balance: String(DEFAULT_BTC_BALANCE),
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
