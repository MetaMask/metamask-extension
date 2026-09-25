import FixtureBuilderV2 from '../../../../fixtures/fixture-builder-v2';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';

/**
 * Enables the batch-sell remote flag so native coin overflow uses the More menu
 * (Receive + Batch sell) rather than the legacy sole-default button layout.
 */
const TRON_ASSETS_REMOTE_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    batchSell: { enabled: true },
  },
} as const;

/** Runtime override so batchSell survives client-config flag refresh in E2E. */
const TRON_ASSETS_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    batchSell: { enabled: true },
  },
} as const;

/**
 * Builds the fixtures used by the Tron assets specs: native main balance
 * display disabled plus the batch-sell remote flag.
 *
 * @returns A `FixtureBuilderV2` configured for Tron assets tests.
 */
export function buildTronAssetsFixture(): FixtureBuilderV2 {
  return new FixtureBuilderV2()
    .withShowNativeTokenAsMainBalanceDisabled()
    .withRemoteFeatureFlagController(TRON_ASSETS_REMOTE_FEATURE_FLAGS);
}

/**
 * Builds the `withTronFixtures` options shared by the Tron assets specs.
 *
 * @param accounts - Tron accounts to seed the fixtures with.
 * @param title - Full title of the running test, used to pick the per-test
 * snapshot.
 * @returns The options bag to pass into `withTronFixtures`.
 */
export function tronAssetsTestConfig(
  accounts: Parameters<typeof withTronFixtures>[0]['accounts'],
  title?: string,
): Parameters<typeof withTronFixtures>[0] {
  return {
    accounts,
    fixtures: buildTronAssetsFixture().build(),
    manifestFlags: TRON_ASSETS_MANIFEST_FLAGS,
    title,
  };
}
