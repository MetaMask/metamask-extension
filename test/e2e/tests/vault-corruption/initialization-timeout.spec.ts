import assert from 'node:assert/strict';
import { INITIALIZATION_TIMEOUT_ERROR } from '../../../../shared/constants/errors';
import { WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import { type Driver } from '../../webdriver/driver';
import { completeVaultRecoveryOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import {
  getFirstAddress,
  onboardThenTriggerCorruptionFlow,
} from '../../page-objects/flows/vault-corruption.flow';
import VaultRecoveryPage from '../../page-objects/pages/vault-recovery-page';
import { getConfig, simpleReloadScript } from './helpers';

// The background timeout is 10 seconds
const INITIALIZATION_TIMEOUT = 10_000;

/**
 * Tests for initialization timeout recovery.
 *
 * These tests verify that when background initialization hangs (e.g., due to
 * corrupted state data), the extension detects the timeout and triggers the
 * vault recovery flow, allowing users to restore from their IndexedDB backup.
 *
 * The simulateInitializationHang manifest flag causes initialization to hang
 * indefinitely, but only after a backup exists in IndexedDB. This allows
 * onboarding to complete normally before triggering the hang on reload.
 */
describe('Initialization Timeout Recovery', function () {
  this.timeout(120000); // Long timeout due to 10s initialization timeout

  it('recovers from initialization timeout when backup exists', async function () {
    const config = getConfig(this.test?.title, {
      additionalIgnoredErrors: [
        // Expected error from the initialization timeout
        `PersistenceError: ${INITIALIZATION_TIMEOUT_ERROR}`,
      ],
      additionalManifestFlags: {
        testing: {
          // This flag causes initialization to hang after backup exists
          simulateInitializationHang: true,
        },
      },
    });

    await withFixtures(config, async ({ driver }: { driver: Driver }) => {
      // Phase 1: Onboard, get address, lock, reload, and wait for recovery page
      // Use a longer timeout to account for the 10s initialization timeout
      const initialFirstAddress = await onboardThenTriggerCorruptionFlow(
        driver,
        simpleReloadScript,
        { recoveryPageTimeout: INITIALIZATION_TIMEOUT + 15000 },
      );

      // Phase 2: Start recovery
      const vaultRecoveryPage = new VaultRecoveryPage(driver);
      await vaultRecoveryPage.clickRecoveryButton({ confirm: true });

      // Phase 3: Complete vault recovery onboarding
      await completeVaultRecoveryOnboardingFlow({
        driver,
        password: WALLET_PASSWORD,
      });
      const restoredFirstAddress = await getFirstAddress(driver);

      // Phase 4: Verify address is preserved
      assert.equal(
        restoredFirstAddress,
        initialFirstAddress,
        'Restored address should match the original address',
      );
    });
  });
});
