import assert from 'node:assert/strict';
import { Mockttp } from 'mockttp';
import { MOCK_ANALYTICS_ID, WALLET_PASSWORD } from '../../constants';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { type Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import {
  completeCreateNewWalletOnboardingFlow,
  completeVaultRecoveryOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import {
  getFirstAddress,
  onboardThenTriggerCorruptionFlow,
  simpleReloadScript,
} from '../../page-objects/flows/vault-corruption.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import VaultRecoveryPage from '../../page-objects/pages/vault-recovery-page';
import { getConfig, mockFeatureFlagsWithoutNonEvmAccounts } from './helpers';

/**
 * Mocks the Segment event sent after a persistence write succeeds on retry.
 * The literal event and property names intentionally make schema changes fail
 * this test instead of changing alongside a shared constant.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked Segment endpoint.
 */
async function mockWriteRetryRecoveredEvent(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Data Persistence Write Retry Recovered',
            properties: {
              category: 'Error',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              persistence_event: 'persist-retry-recovered',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              first_error_message:
                'Simulated storage.local.set failure for testing',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              first_error_name: 'Error',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              retry_delay_ms: 500,
            },
          },
        ],
      })
      .thenCallback(() => ({ statusCode: 200 })),
  ];
}

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
      const config = getConfig(this.test?.title, {
        additionalIgnoredErrors: [
          'Simulated storage.local.get failure for testing',
        ],
        additionalManifestFlags: {
          testing: {
            // Enable the simulation flag - it will only trigger after backup exists
            simulateStorageGetFailure: true,
          },
        },
      });
      await withFixtures(
        {
          ...config,
          testSpecificMock: mockFeatureFlagsWithoutNonEvmAccounts,
        },
        async ({ driver }: { driver: Driver }) => {
          // Phase 1: Onboard, get address, lock, reload, and wait for vault recovery
          // The simulateStorageGetFailure manifest flag triggers after backup exists
          const initialFirstAddress = await onboardThenTriggerCorruptionFlow(
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
          // After restoring from backup, multichain account sync may hang in
          // CI. Skip the sync check — we only need to read the existing address.
          const restoredFirstAddress = await getFirstAddress(
            driver,
            undefined,
            {
              waitForSync: false,
            },
          );

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
    it('tracks recovery when a persistence write succeeds on retry', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              analyticsId: MOCK_ANALYTICS_ID,
              completedMetaMetricsOnboarding: true,
              optedIn: true,
            })
            .build(),
          manifestFlags: {
            testing: {
              simulateStorageSetFailure: 'once',
            },
          },
          testSpecificMock: mockWriteRetryRecoveredEvent,
          title: this.test?.fullTitle(),
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);

          const events = await getEventPayloads(driver, mockedEndpoints);
          assert.equal(events.length, 1);
          assert.equal(
            events[0].event,
            'Data Persistence Write Retry Recovered',
          );
          assert.equal(events[0].properties.category, 'Error');
          assert.equal(
            events[0].properties.persistence_event,
            'persist-retry-recovered',
          );
          assert.equal(
            events[0].properties.first_error_message,
            'Simulated storage.local.set failure for testing',
          );
          assert.equal(events[0].properties.first_error_name, 'Error');
          assert.equal(events[0].properties.retry_delay_ms, 500);
        },
      );
    });

    it('shows storage error toast when set() fails after onboarding', async function () {
      await withFixtures(
        getConfig(this.test?.title, {
          additionalIgnoredErrors: [
            'Simulated storage.local.set failure for testing',
          ],
          additionalManifestFlags: {
            testing: {
              // Enable set failure - will trigger immediately
              simulateStorageSetFailure: true,
            },
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
