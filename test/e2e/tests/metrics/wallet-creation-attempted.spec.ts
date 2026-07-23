import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  goToOnboardingWelcomeLoginPage,
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
  skipPasskeySetup,
} from '../../page-objects/flows/onboarding.flow';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  MOCK_ANALYTICS_ID,
  WALLET_PASSWORD,
  WINDOW_TITLES,
} from '../../constants';
import { Driver } from '../../webdriver/driver';
import { mockSegment } from './mocks/segment';

const WALLET_CREATION_ATTEMPTED_EVENT = 'Wallet Creation Attempted';

async function navigateToCreatePasswordPage(driver: Driver) {
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    optedIn: true,
  });
  await startOnboardingPage.clickCreateWalletButton();
  await startOnboardingPage.checkTermsOfUsageAndPrivacyLinksAreVisible();
  await startOnboardingPage.clickCreateWithSrpButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  return onboardingPasswordPage;
}

async function completeOnboardingFromPasswordPage(
  driver: Driver,
  onboardingPasswordPage: OnboardingPasswordPage,
) {
  await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
  await skipPasskeySetup(driver);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();
  await secureWalletPage.revealAndConfirmSRP();

  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    await onboardingMetricsFlow(driver, { optedIn: true });
  }

  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();
  await handleSidepanelPostOnboarding(driver);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForLoadingOverlayToDisappear();
}

type SegmentTrackEvent = {
  type?: string;
  event?: string;
  properties?: Record<string, unknown>;
};

function getWalletCreationAttemptedEvents(events: SegmentTrackEvent[]) {
  return events.filter(
    (event) =>
      event.type === 'track' && event.event === WALLET_CREATION_ATTEMPTED_EVENT,
  );
}

describe('Wallet Creation Attempted event', function () {
  it('is sent when the password is created after a dapp send attempt', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          return await mockSegment(server, [WALLET_CREATION_ATTEMPTED_EVENT]);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        const onboardingPasswordPage =
          await navigateToCreatePasswordPage(driver);

        // Attempt a dapp send before the password exists.
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const sendButton = await driver.findElement('#sendButton');
        assert.equal(
          await sendButton.isEnabled(),
          false,
          'Expected send button to stay disabled before password creation',
        );

        // Create the password after the dapp send attempt, then assert the event.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await onboardingPasswordPage.checkPageIsLoaded();
        await completeOnboardingFromPasswordPage(
          driver,
          onboardingPasswordPage,
        );

        const events = await getEventPayloads(driver, mockedEndpoints);
        const trackEvents = getWalletCreationAttemptedEvents(events);

        assert.equal(trackEvents.length, 1);
        assert.deepStrictEqual(trackEvents[0].properties, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask',
          category: 'Onboarding',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
        });
      },
    );
  });

  it('is not sent when the user reaches create password but does not create one', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          return await mockSegment(server, [WALLET_CREATION_ATTEMPTED_EVENT]);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await navigateToCreatePasswordPage(driver);

        const events = await getEventPayloads(driver, mockedEndpoints, false);
        assert.equal(getWalletCreationAttemptedEvents(events).length, 0);
      },
    );
  });
});
