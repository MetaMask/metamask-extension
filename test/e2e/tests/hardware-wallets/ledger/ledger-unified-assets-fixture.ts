import { HARDWARE_WALLET_ACCOUNT_ID } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';

export const LEDGER_LOCALHOST_NATIVE_ASSET_ID = 'eip155:1337/slip44:1';

/**
 * Human-readable ETH matching `setAccountBalance(..., '0x100000000000000000000')`,
 * which the homepage displays as `1.21M`.
 */
export const LEDGER_LARGE_ETH_BALANCE_HUMAN = '1208925.8196146293';

/**
 * Seeds unified AssetsController balance for the Ledger hardware account on localhost.
 * @param builder
 */
export function withLedgerUnifiedAssetsBalance(builder: FixtureBuilderV2) {
  return builder.withAssetsController({
    assetsBalance: {
      [HARDWARE_WALLET_ACCOUNT_ID]: {
        [LEDGER_LOCALHOST_NATIVE_ASSET_ID]: {
          amount: LEDGER_LARGE_ETH_BALANCE_HUMAN,
        },
      },
    },
  });
}
