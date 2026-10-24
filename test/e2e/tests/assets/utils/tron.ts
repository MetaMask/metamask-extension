import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';

/**
 * Enables the batch-sell remote flag so native coin overflow uses the More
 * menu (Receive + Batch sell) rather than the legacy sole-default button
 * layout. Set both in the fixture state and as a manifest flag so it survives
 * the client-config flag refresh in E2E (production default is disabled).
 */
const TRON_ASSETS_BATCH_SELL_FLAGS = {
  remoteFeatureFlags: {
    batchSell: { enabled: true },
  },
} as const;

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
    // Read-only flows: static mocks instead of a local java-tron node.
    localNode: false,
    fixtures: new FixtureBuilderV2()
      .withShowNativeTokenAsMainBalanceDisabled()
      .withRemoteFeatureFlagController(TRON_ASSETS_BATCH_SELL_FLAGS)
      .build(),
    manifestFlags: TRON_ASSETS_BATCH_SELL_FLAGS,
    title,
  };
}
