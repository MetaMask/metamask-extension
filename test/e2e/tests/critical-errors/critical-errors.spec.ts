import assert from 'node:assert/strict';
import { Suite } from 'mocha';
import { WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import CriticalErrorPage from '../../page-objects/pages/critical-error-page';
import { PAGES } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import { getManifestVersion } from '../../set-manifest-flags';
import { completeVaultRecoveryOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import {
  getFirstAddress,
  onboardThenTriggerTimeOutFlow,
} from '../../page-objects/flows/vault-corruption.flow';
import { getConfig } from '../vault-corruption/helpers';

// Match timeout values in critical-startup-error-handler.ts
const BACKGROUND_CONNECTION_TIMEOUT = 15_000;

describe('Critical errors', function (this: Suite) {
  it('shows critical error screen when background is unresponsive', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        ignoredConsoleErrors: ['Background connection unresponsive'],
        manifestFlags: {
          testing: {
            // Simulate completely unresponsive background
            simulateDelayedBackgroundResponse: true,
          },
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.HOME, { waitForControllers: false });

        // Wait until timeout expires
        await driver.delay(BACKGROUND_CONNECTION_TIMEOUT);

        const criticalErrorPage = new CriticalErrorPage(driver);
        await criticalErrorPage.checkPageIsLoaded();
        await criticalErrorPage.validateTroubleStartingDescription();
        await criticalErrorPage.validateErrorMessage(
          'Background connection unresponsive',
        );
      },
    );
  });

  it('shows critical error screen when background takes over 15 seconds to respond', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        ignoredConsoleErrors: ['Background connection unresponsive'],
        manifestFlags: {
          testing: {
            // Delay for 100ms longer than timeout, simulating a very slow background response
            simulateDelayedBackgroundResponse:
              BACKGROUND_CONNECTION_TIMEOUT + 100,
          },
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.HOME, { waitForControllers: false });

        // Wait one additional second after timeout to ensure background has had time to respond,
        // to ensure that the critical error screen remains in place even after the background
        // responds.
        await driver.delay(BACKGROUND_CONNECTION_TIMEOUT + 1_000);

        const criticalErrorPage = new CriticalErrorPage(driver);
        await criticalErrorPage.checkPageIsLoaded();
        await criticalErrorPage.validateTroubleStartingDescription();
        await criticalErrorPage.validateErrorMessage(
          'Background connection unresponsive',
        );
      },
    );
  });

  it('shows critical error screen when background takes over 16 seconds to initialize, and allows user to restore accounts', async function () {
    this.timeout(120_000);
    await withFixtures(
      getConfig(this.test?.fullTitle(), {
        additionalIgnoredErrors: ['Background initialization timeout'],
        additionalManifestFlags: {
          testing: {
            simulateBackgroundInitializationHang: true,
          },
        },
      }),
      async ({ driver }) => {
        const initialFirstAddress = await onboardThenTriggerTimeOutFlow(driver);

        const criticalErrorPage = new CriticalErrorPage(driver);
        await criticalErrorPage.checkPageIsLoaded();
        await criticalErrorPage.validateTroubleStartingDescription();
        await criticalErrorPage.validateErrorMessage(
          'Background initialization timeout',
        );

        await criticalErrorPage.clickRestoreAccountsLink({ confirm: true });

        await completeVaultRecoveryOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
        });
        const restoredFirstAddress = await getFirstAddress(driver);

        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Restored address should match the original address',
        );
      },
    );
  });

  it('shows critical error screen when background takes over 16 seconds to sync state, and allows user to restore accounts', async function () {
    this.timeout(120_000);
    await withFixtures(
      getConfig(this.test?.fullTitle(), {
        additionalIgnoredErrors: ['Background state sync timeout'],
        additionalManifestFlags: {
          testing: {
            simulateBackgroundStateSyncHang: true,
          },
        },
      }),
      async ({ driver }) => {
        const initialFirstAddress = await onboardThenTriggerTimeOutFlow(driver);

        const criticalErrorPage = new CriticalErrorPage(driver);
        await criticalErrorPage.checkPageIsLoaded();
        await criticalErrorPage.validateTroubleStartingDescription();
        await criticalErrorPage.validateErrorMessage(
          'Background state sync timeout',
        );

        await criticalErrorPage.clickRestoreAccountsLink({ confirm: true });

        await completeVaultRecoveryOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
        });
        const restoredFirstAddress = await getFirstAddress(driver);

        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Restored address should match the original address',
        );
      },
    );
  });

  it('does NOT show critical error screen when background is a "little" slow to respond', async function () {
    // we can skip this test in MV2, since we don't need lazy listeners there
    // as they are installed synchronously in `background.js` anyway.
    if (getManifestVersion() === 2) {
      this.skip();
    }

    const timeoutValue = 5000;
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        ignoredConsoleErrors: ['Background connection unresponsive'],
        manifestFlags: {
          testing: {
            // this causes the background to delay its "ready" signal
            simulatedSlowBackgroundLoadingTimeout: timeoutValue,
          },
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // immediately navigate to home, which will try to connect to the
        // background right away, even though it isn't ready (because of the
        // simulatedSlowBackgroundLoadingTimeout flag)
        await driver.navigate(PAGES.HOME, { waitForControllers: false });

        // Wait until our "slow" bg timer expires before checking
        await driver.delay(timeoutValue * 1.1);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
      },
    );
  });
});
