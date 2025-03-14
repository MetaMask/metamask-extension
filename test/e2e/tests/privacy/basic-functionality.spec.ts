import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';
import {
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';

const EXPECTED_REQUEST_URLS = [
  'https://client-config.api.cx.metamask.io',
  'https://on-ramp-content.api.cx.metamask.io',
  'https://accounts.api.cx.metamask.io',
  'https://phishing-detection.api.cx.metamask.io',
  'https://token.api.cx.metamask.io',
  'https://bridge.api.cx.metamask.io',
  'https://client-side-detection.api.cx.metamask.io',
  'https://swap.api.cx.metamask.io',
  'https://authentication.api.cx.metamask.io',
  'https://nft.api.cx.metamask.io',
  'https://price.api.cx.metamask.io'
];
const EXPECTED_REQUEST_URLS_SET = new Set(EXPECTED_REQUEST_URLS);


async function mockApis(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(/metamask.io/)
      .times(15)
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    await mockServer
      .forGet('https://min-api.cryptocompare.com/data/pricemulti')
      .withQuery({ fsyms: 'ETH,MegaETH', tsyms: 'usd' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            fakedata: 0,
          },
        };
      }),
  ];
}

describe('MetaMask onboarding', function () {
  it('should prevent network requests to basic functionality endpoints when the basic functionality toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await importSRPOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        await homePage.refreshErc20TokenList();

        for (const mockedEndpoint of mockedEndpoints) {
          const requests = await mockedEndpoint.getSeenRequests();
          assert.equal(
            requests.length,
            0,
            `${mockedEndpoint} should make requests after onboarding`,
          );
        }
      },
    );
  });

  it.only('should not prevent network requests to basic functionality endpoints when the basic functionality toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        await homePage.refreshErc20TokenList();


        // intended delay to allow for network requests to complete
        await driver.delay(1000);
        for (const mockedEndpoint of mockedEndpoints) {
          const requests = await mockedEndpoint.getSeenRequests();
          const uniqueRequestURLs = new Set();
          requests.forEach(({ url }: { url: string }) => uniqueRequestURLs.add((new URL(url)).origin))
          console.log('uniqueRequestURLs', uniqueRequestURLs)
          if (requests[0].url.match(/metamask.io/)) {
            assert.deepEqual(uniqueRequestURLs, EXPECTED_REQUEST_URLS_SET);
          } else if (requests[0].url.match(/cryptocompare.com/)) {
            assert.deepEqual(uniqueRequestURLs, new Set(['https://min-api.cryptocompare.com']));
          }
        }
      },
    );
  });
});
