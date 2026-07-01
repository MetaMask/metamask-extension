import { Mockttp } from 'mockttp';

import {
  mockAccountsApiV2EvmOnlySupportedNetworks,
  mockAccountsApiV5EvmOnlyBalances,
} from '../../../helpers/mocks/accounts-api-evm-only';

/**
 * Mock GET /v2/supportedNetworks for the Accounts API (**EVM only**).
 *
 * Solana balances in E2E come from mocked Solana RPC (`mockSolanaBalanceQuote`
 * in `common-solana.ts`), not Accounts API v5.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV2SupportedNetworks(mockServer: Mockttp) {
  return mockAccountsApiV2EvmOnlySupportedNetworks(mockServer);
}

/**
 * Mock GET /v5/multiaccount/balances for the Accounts API (**EVM only**).
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV5MultiaccountBalances(mockServer: Mockttp) {
  return mockAccountsApiV5EvmOnlyBalances(mockServer);
}
