import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../../bridge/constants';
import {
  BRIDGE_ETH_USD_SPOT_PRICE,
  BRIDGE_L2_ETH_BALANCE_PER_CHAIN,
} from '../../bridge/bridge-unified-assets-config';
import { getBridgeFixtures } from '../../bridge/bridge-test-utils';
import { mockLedgerEthDaiSwapQuoteApis } from './mocks/eth-dai-quote-mock';

/** Native ETH seeded on the local Anvil mainnet node for the Ledger account. */
export const LEDGER_SWAP_MAINNET_ETH = '20';

/** Same balance in wei, for `setAccountBalance` on the local node. */
export const LEDGER_SWAP_MAINNET_ETH_WEI = '0x1158e460913d00000';

/**
 * Homepage fiat total for Ledger swap fixtures: mainnet 20 ETH + Linea/Arbitrum
 * 25 ETH each, priced at the standard bridge ETH/USD spot rate.
 */
export const LEDGER_SWAP_EXPECTED_FIAT_BALANCE = `$${(
  (Number(LEDGER_SWAP_MAINNET_ETH) + BRIDGE_L2_ETH_BALANCE_PER_CHAIN * 2) *
  BRIDGE_ETH_USD_SPOT_PRICE
).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

/**
 * Bridge fixtures with a selected Ledger account for unified swap E2E.
 * @param title
 */
export function getLedgerSwapFixtures(title?: string) {
  const base = getBridgeFixtures({
    title,
    featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
  });
  const ledgerFixture = new FixtureBuilderV2()
    .withLedgerAccount()
    .withSmartTransactionsOptedOut()
    .build();
  const originalMock = base.testSpecificMock;

  return {
    ...base,
    fixtures: {
      ...base.fixtures,
      data: {
        ...base.fixtures.data,
        KeyringController: ledgerFixture.data.KeyringController,
        AccountsController: ledgerFixture.data.AccountsController,
        PreferencesController: {
          ...base.fixtures.data.PreferencesController,
          preferences: {
            ...base.fixtures.data.PreferencesController?.preferences,
            ...ledgerFixture.data.PreferencesController?.preferences,
          },
        },
      },
    },
    // Mainnet is the local Anvil node, so keep the mocked Accounts API balance
    // in sync with the ETH seeded on it; L2 chains keep the bridge default.
    unifiedEvmAccountsApiBalances: {
      ...base.unifiedEvmAccountsApiBalances,
      mainnetNativeEthHuman: LEDGER_SWAP_MAINNET_ETH,
    },
    testSpecificMock: async (mockServer: Mockttp) => {
      const mocks = originalMock ? await originalMock(mockServer) : [];
      await mockLedgerEthDaiSwapQuoteApis(mockServer);
      return mocks;
    },
  };
}
