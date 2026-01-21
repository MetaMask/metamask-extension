import assert from 'node:assert/strict';
import { WALLET_PASSWORD, withFixtures } from '../../helpers';
import { type Driver } from '../../webdriver/driver';
import {
  completeCreateNewWalletOnboardingFlow,
  completeVaultRecoveryOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import VaultRecoveryPage from '../../page-objects/pages/vault-recovery-page';
import {
  onboardThenTriggerCorruption,
  getConfig,
  getFirstAddress,
} from './helpers';

/**
 * Simple script that reloads the extension.
 * Used when manifest flags (like simulateStorageGetFailure) handle the corruption simulation.
 */
const simpleReloadScript = `
  const callback = arguments[arguments.length - 1];
  const browser = globalThis.browser ?? globalThis.chrome;
  browser.runtime.reload();
  callback();
`;

/**
 * Tests for storage operations failure recovery.
 *
 * These tests verify the workarounds for Firefox database corruption scenarios
 * where browser.storage.local operations fail with "An unexpected error occurred".
 *
 * See PR #39010 for details on the workarounds being tested:
 * 1. Vault Recovery on get() failure - When storage.local.get() fails but backup exists
 * 2. Storage Error Toast on set() failure - When storage.local.set() fails after onboarding
 */
describe('Storage Operations Failure Recovery', function () {
  this.timeout(120000); // Long timeout for these complex tests

  describe('storage.local.get() failure with simulateStorageGetFailure flag', function () {
    it('triggers vault recovery when get() fails but backup exists in IndexedDB', async function () {
      await withFixtures(
        getConfig(this.test?.title, {
          additionalIgnoredErrors: [
            'Simulated storage.local.get failure for testing',
          ],
          additionalManifestFlags: {
            // Enable the simulation flag - it will only trigger after backup exists
            simulateStorageGetFailure: true,
          },
        }),
        async ({ driver }: { driver: Driver }) => {
          // Phase 1: Onboard, get address, lock, reload, and wait for vault recovery
          // The simulateStorageGetFailure manifest flag triggers after backup exists
          const initialFirstAddress = await onboardThenTriggerCorruption(
            driver,
            simpleReloadScript,
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
        },
      );
    });
  });

  describe('storage.local.set() failure with simulateStorageSetFailure flag', function () {
    it('shows storage error toast when set() fails after onboarding', async function () {
      await withFixtures(
        getConfig(this.test?.title, {
          additionalIgnoredErrors: [
            'Simulated storage.local.set failure for testing',
          ],
          additionalManifestFlags: {
            // Enable set failure - will trigger immediately
            simulateStorageSetFailure: true,
          },
        }),
        async ({ driver }: { driver: Driver }) => {
          // Complete onboarding - writes fail immediately but onboarding still completes
          await completeCreateNewWalletOnboardingFlow({
            driver,
            password: WALLET_PASSWORD,
            skipSRPBackup: true,
          });

          // Wait for homepage to be ready
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();

          // The toast should appear because writes are failing
          await homePage.checkStorageErrorToastIsDisplayed();

          // Click the toast action button to navigate to reveal SRP page
          await homePage.clickStorageErrorToastBackupButton();
        },
      );
    });
  });
});
