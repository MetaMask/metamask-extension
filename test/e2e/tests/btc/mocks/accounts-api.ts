import { Mockttp } from 'mockttp';

import {
  mockAccountsApiV2EvmOnlySupportedNetworks,
  mockAccountsApiV5EvmOnlyBalances,
} from '../../../helpers/mocks/accounts-api-evm-only';

/**
 * Mock GET /v2/supportedNetworks for the Accounts API (EVM only).
 *
 * Bitcoin balances come from the Bitcoin snap + esplora mocks, not Accounts API.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV2WithBtc(mockServer: Mockttp) {
  return mockAccountsApiV2EvmOnlySupportedNetworks(mockServer);
}

/**
 * Mock GET /v5/multiaccount/balances (EVM only).
 *
 * BTC balances are supplied by SnapDataSource via esplora mocks and fixture
 * seeding in `buildBtcUnifiedAssetsFixtures`.
 *
 * @param mockServer - The mock server instance.
 */
export function mockAccountsApiV5WithBtc(mockServer: Mockttp) {
  return mockAccountsApiV5EvmOnlyBalances(mockServer);
}
