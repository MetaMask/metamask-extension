import assert from 'node:assert/strict';
import type { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { WALLET_PASSWORD } from '../../constants';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import CriticalErrorPage from '../../page-objects/pages/critical-error-page';
import DeepLink from '../../page-objects/pages/deep-link-page';
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
import {
  bytesToB64,
  generateECDSAKeyPair,
  mockDeepLinkPages,
  prepareDeepLinkUrl,
} from '../deep-link/helpers';

// Match timeout values in critical-startup-error-handler.ts
const BACKGROUND_CONNECTION_TIMEOUT = 15_000;
const DEEP_LINK_UTM_SOURCE = 'critical-error-timeout-recovery';

function isMatchingDeepLinkEvent(event: Record<string, unknown> | undefined) {
  return (
    event?.event === MetaMetricsEventName.DeepLinkUsed &&
    (event.properties as Record<string, unknown> | undefined)?.route ===
      '/home' &&
    (event.properties as Record<string, unknown> | undefined)?.utm_source ===
      DEEP_LINK_UTM_SOURCE
  );
}

async function getDeepLinkEventCount(
  driver: Parameters<typeof getEventPayloads>[0],
  mockedEndpoints: Parameters<typeof getEventPayloads>[1],
): Promise<number> {
  const events = await getDeepLinkEvents(driver, mockedEndpoints);
  return events.filter((event) => Boolean(event?.userId)).length;
}

async function getDeepLinkEvents(
  driver: Parameters<typeof getEventPayloads>[0],
  mockedEndpoints: Parameters<typeof getEventPayloads>[1],
) {
  const events = await getEventPayloads(driver, mockedEndpoints);
  return events.filter((event) =>
    isMatchingDeepLinkEvent(event as Record<string, unknown> | undefined),
  );
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

  it('emits DeepLinkUsed only once after restoring from a background state sync timeout', async function () {
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }

    this.timeout(150_000);

    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    async function mockServices(mockServer: Mockttp) {
      await mockFeatureFlagsWithoutNonEvmAccounts(mockServer);
      await mockDeepLinkPages(mockServer);

      const segmentEndpoint = await mockServer
        .forPost('https://api.segment.io/v1/batch')
        .always()
        .thenCallback(async (request) => {
          const body = await request.body.getJson();
          const matchingEvents = (body.batch ?? []).filter(
            (event: Record<string, unknown>) =>
              event.event === MetaMetricsEventName.DeepLinkUsed &&
              (event.properties as Record<string, unknown> | undefined)
                ?.route === '/home' &&
              (event.properties as Record<string, unknown> | undefined)
                ?.utm_source === DEEP_LINK_UTM_SOURCE,
          );

          if (matchingEvents.length > 0) {
            console.log(
              '[critical-errors] matching DeepLinkUsed segment events:',
              JSON.stringify(matchingEvents, null, 2),
            );
          }

          return {
            statusCode: 200,
          };
        });

      return [segmentEndpoint];
    }

    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle(), {
          additionalIgnoredErrors: ['Background state sync timeout'],
          additionalManifestFlags: {
            testing: {
              deepLinkPublicKey,
              simulateBackgroundStateSyncHang: true,
            },
          },
        }),
        disableServerMochaToBackground: true,
        testSpecificMock: mockServices,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await onboardThenTriggerTimeOutFlow(driver);

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

        const deepLinkEventsBefore = await getDeepLinkEventCount(
          driver,
          mockedEndpoints,
        );

        const preparedUrl = await prepareDeepLinkUrl({
          route: `/home?utm_source=${DEEP_LINK_UTM_SOURCE}`,
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });

        await driver.openNewURL(preparedUrl);

        const deepLinkPage = new DeepLink(driver);
        await deepLinkPage.checkPageIsLoaded();

        await driver.wait(async () => {
          const deepLinkEventsCurrent = await getDeepLinkEventCount(
            driver,
            mockedEndpoints,
          );

          return deepLinkEventsCurrent >= deepLinkEventsBefore + 1;
        }, 10_000);

        const deepLinkEventsAfter = await getDeepLinkEventCount(
          driver,
          mockedEndpoints,
        );
        const deepLinkEvents = await getDeepLinkEvents(driver, mockedEndpoints);
        const userScopedDeepLinkEvents = deepLinkEvents.filter((event) =>
          Boolean(event?.userId),
        );

        console.log(
          '[critical-errors] deep link event count delta:',
          deepLinkEventsAfter - deepLinkEventsBefore,
        );
        console.log(
          '[critical-errors] matching DeepLinkUsed events after navigation:',
          JSON.stringify(deepLinkEvents, null, 2),
        );
        console.log(
          '[critical-errors] user-scoped DeepLinkUsed events after navigation:',
          JSON.stringify(userScopedDeepLinkEvents, null, 2),
        );

        assert.equal(
          deepLinkEventsAfter - deepLinkEventsBefore,
          1,
          'Opening one deep link after timeout recovery should emit one user-scoped deep link metric',
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
