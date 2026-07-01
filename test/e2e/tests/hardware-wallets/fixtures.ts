import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  HARDWARE_WALLET_ACCOUNT_ID,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  LOCALHOST_NATIVE_ASSET_ID,
  MAINNET_NATIVE_ASSET_ID,
} from '../tokens/utils/mocks';

/**
 * Accounts API v5 overrides for hardware-wallet connect flows.
 * Newly unlocked accounts must report zero native balance so the homepage
 * "Fund your wallet" empty state can appear under unified assets.
 */
export const HARDWARE_WALLET_ZERO_BALANCE_API_OVERRIDES = {
  mainnetNativeEthHuman: '0',
  localhostNativeEthHuman: '0',
  nativeBalance: '0',
} as const;

/** Zero native balances for HD + hardware wallet accounts (unified assets). */
export const HARDWARE_WALLET_ZERO_ASSETS_BALANCE = {
  [DEFAULT_FIXTURE_ACCOUNT_ID]: {
    [MAINNET_NATIVE_ASSET_ID]: { amount: '0' },
    [LOCALHOST_NATIVE_ASSET_ID]: { amount: '0' },
  },
  [HARDWARE_WALLET_ACCOUNT_ID]: {
    [MAINNET_NATIVE_ASSET_ID]: { amount: '0' },
    [LOCALHOST_NATIVE_ASSET_ID]: { amount: '0' },
  },
};

/**
 * Default E2E fixture with zero native balances for the HD account.
 *
 * After connecting a hardware wallet, `selectedAccountGroup` may still reference
 * the HD account group briefly; seeding zero balances avoids treating the group
 * as funded while unified assets is enabled.
 */
export function buildHardwareWalletConnectFixture() {
  return new FixtureBuilderV2()
    .withAssetsController(
      {
        assetsBalance: HARDWARE_WALLET_ZERO_ASSETS_BALANCE,
      },
      { overwrite: true },
    )
    .build();
}
