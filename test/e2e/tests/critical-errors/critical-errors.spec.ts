import assert from 'node:assert/strict';
import type { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { WALLET_PASSWORD } from '../../constants';
import {
  getEventPayloads,
  veryLargeDelayMs,
  withFixtures,
} from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import CriticalErrorPage from '../../page-objects/pages/critical-error-page';
import PhishingWarningPage from '../../page-objects/pages/phishing-warning-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { PAGES } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import { getManifestVersion } from '../../set-manifest-flags';
import { completeVaultRecoveryOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import {
  getFirstAddress,
  onboardThenTriggerTimeOutFlow,
} from '../../page-objects/flows/vault-corruption.flow';
import {
  getConfig,
  mockFeatureFlagsWithoutNonEvmAccounts,
} from '../vault-corruption/helpers';
import { BlockProvider } from '../phishing-controller/helpers';
import { setupPhishingDetectionMocks } from '../phishing-controller/mocks';

// Match timeout values in critical-startup-error-handler.ts
const BACKGROUND_CONNECTION_TIMEOUT = 15_000;
const DEFAULT_BLOCKED_DOMAIN =
  'a379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce1947';

async function getTrackedEventCount(
  driver: Parameters<typeof getEventPayloads>[0],
  mockedEndpoints: Parameters<typeof getEventPayloads>[1],
  eventName: MetaMetricsEventName,
): Promise<number> {
  const events = await getEventPayloads(driver, mockedEndpoints);
  return events.filter((event) => event?.event === eventName).length;
}

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
      {
        ...getConfig(this.test?.fullTitle(), {
          additionalIgnoredErrors: ['Background initialization timeout'],
          additionalManifestFlags: {
            testing: {
              simulateBackgroundInitializationHang: true,
            },
          },
        }),
        testSpecificMock: mockFeatureFlagsWithoutNonEvmAccounts,
      },
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
      {
        ...getConfig(this.test?.fullTitle(), {
          additionalIgnoredErrors: ['Background state sync timeout'],
          additionalManifestFlags: {
            testing: {
              simulateBackgroundStateSyncHang: true,
            },
          },
        }),
        testSpecificMock: mockFeatureFlagsWithoutNonEvmAccounts,
      },
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

  it('emits PhishingPageDisplayed only once after restoring from a background state sync timeout', async function () {
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }

    this.timeout(150_000);

    async function mockServices(mockServer: Mockttp) {
      await mockFeatureFlagsWithoutNonEvmAccounts(mockServer);
      await setupPhishingDetectionMocks(mockServer, {
        statusCode: 200,
        blockProvider: BlockProvider.MetaMask,
        blocklist: ['127.0.0.1'],
        c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
        blocklistPaths: [],
      });

      const segmentEndpoint = await mockServer
        .forPost('https://api.segment.io/v1/batch')
        .always()
        .thenCallback(() => ({
          statusCode: 200,
        }));

      return [segmentEndpoint];
    }

    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle(), {
          additionalIgnoredErrors: ['Background state sync timeout'],
          additionalManifestFlags: {
            testing: {
              simulateBackgroundStateSyncHang: true,
            },
          },
        }),
        disableServerMochaToBackground: true,
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockServices,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await onboardThenTriggerTimeOutFlow(driver, {
          // Opt into MetaMetrics before the timeout so the pre-restore controller
          // can also emit, which makes duplicate phishing listeners observable.
          participateInMetaMetrics: true,
        });

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
          participateInMetaMetrics: true,
        });

        const phishingEventsBefore = await getTrackedEventCount(
          driver,
          mockedEndpoints,
          MetaMetricsEventName.PhishingPageDisplayed,
        );

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // This mitigates a race where the initial blocked navigation refreshes before
        // the phishing warning tab is fully attached.
        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');

        const phishingWarningPage = new PhishingWarningPage(driver);
        await phishingWarningPage.checkPageIsLoaded();

        const phishingEventsAfter = await getTrackedEventCount(
          driver,
          mockedEndpoints,
          MetaMetricsEventName.PhishingPageDisplayed,
        );

        assert.equal(
          phishingEventsAfter - phishingEventsBefore,
          1,
          'Opening a blocked page after timeout recovery should emit one phishing metric',
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
