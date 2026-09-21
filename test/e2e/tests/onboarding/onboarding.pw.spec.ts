import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { E2E_DRIVER, TEST_SEED_PHRASE, WALLET_PASSWORD } from '../../constants';
import {
  convertToHexValue,
  withFixtures,
  isSidePanelEnabled,
} from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import OnboardingSrpPage from '../../page-objects/pages/onboarding/onboarding-srp-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
  completeImportSRPOnboardingWithPasskey,
  completeOnboardingWithPasskey,
  goToOnboardingWelcomeLoginPage,
  handleSidepanelPostOnboarding,
  importSRPOnboardingFlow,
  incompleteCreateNewWalletOnboardingFlow,
  onboardingMetricsFlow,
  skipPasskeySetup,
} from '../../page-objects/flows/onboarding.flow';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import { lockAndWaitForPasskeyUnlockPage } from '../../page-objects/flows/login.flow';
import DeepLink from '../../page-objects/pages/security/deep-link-page';
import { getMockAssetsPrice } from '../tokens/utils/mocks';

const IMPORTED_SRP_ACCOUNT_1 = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

const MOCK_ETH_PRICE = 1700;

const NATIVE_ASSETS_INFO = {
  'eip155:1/slip44:60': {
    type: 'native' as const,
    decimals: 18,
    symbol: 'ETH',
    name: 'Ethereum',
  },
};

async function mockSpotPrices(mockServer: Mockttp) {
  return await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'eip155:1/slip44:60': {
          id: 'ethereum',
          price: MOCK_ETH_PRICE,
          marketCap: 382623505141,
          pricePercentChange1d: 0,
        },
      },
    }));
}

async function mockCustomNetworkOnboarding(mockServer: Mockttp) {
  await mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .always()
    .thenJson(200, {
      fullSupport: [
        'eip155:1',
        'eip155:137',
        'eip155:56',
        'eip155:59144',
        'eip155:8453',
        'eip155:10',
        'eip155:42161',
        'eip155:534352',
        'eip155:1337',
        'eip155:1338',
      ],
      partialSupport: ['eip155:42220', 'eip155:43114'],
    });

  await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'eip155:1338/slip44:60': {
          id: 'ethereum',
          price: 1700,
          marketCap: 382623505141,
          pricePercentChange1d: 0,
        },
      },
    }));
}

pwTest.describe('MetaMask onboarding', () => {
  pwTest(
    "Creates a new wallet, sets up a secure password, and doesn't complete the onboarding process and refreshes the page",
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withAssetsController({ assetsInfo: NATIVE_ASSETS_INFO })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await incompleteCreateNewWalletOnboardingFlow({ driver });
          await driver.refresh();

          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();
          await loginPage.loginToHomepage();
          await skipPasskeySetup(driver);

          const secureWalletPage = new SecureWalletPage(driver);
          await secureWalletPage.checkPageIsLoaded();
          await secureWalletPage.revealAndConfirmSRP();

          if (testInfo.project.name !== 'firefox-e2e') {
            await onboardingMetricsFlow(driver);
          }

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
          await onboardingCompletePage.completeOnboarding();

          await handleSidepanelPostOnboarding(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('0');
        },
      );
    },
  );

  pwTest(
    'opens Terms of Use and Privacy notice links from login options',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
            driver,
          });
          await startOnboardingPage.clickCreateWalletButton();
          await startOnboardingPage.checkTermsOfUsageAndPrivacyLinksAreVisible();
          await startOnboardingPage.clickTermsOfUseLinkAndVerifyExpectedUrlOpens();
          await startOnboardingPage.clickPrivacyNoticeLinkAndVerifyExpectedUrlOpens();
        },
      );
    },
  );

  pwTest(
    'Creates a new wallet, sets up a secure password, and completes the onboarding process',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await completeCreateNewWalletOnboardingFlow({
            driver,
          });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('0');
        },
      );
    },
  );

  pwTest(
    'Imports an existing wallet, sets up a secure password, and completes the onboarding process',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withPreferencesController({
              preferences: {
                showNativeTokenAsMainBalance: true,
              },
            })
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .withCurrencyController({
              currencyRates: {
                ETH: {
                  conversionDate: Date.now(),
                  conversionRate: MOCK_ETH_PRICE,
                  usdConversionRate: MOCK_ETH_PRICE,
                },
              },
            })
            .withAssetsController({
              assetsPrice: getMockAssetsPrice(MOCK_ETH_PRICE),
            })
            .build(),
          testSpecificMock: mockSpotPrices,
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await completeImportSRPOnboardingFlow({ driver });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');
        },
      );
    },
  );

  pwTest(
    'Attempts to import a wallet with an incorrect Secret Recovery Phrase and verifies the error message',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          const wrongSeedPhrase =
            'test test test test test test test test test test test test';
          await driver.navigate();

          if (testInfo.project.name === 'firefox-e2e') {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
            await onboardingMetricsPage.skipMetricAndContinue();
          }

          const startOnboardingPage = new StartOnboardingPage(driver);
          await startOnboardingPage.checkLoginPageIsLoaded();
          await startOnboardingPage.importWallet();

          const onboardingSrpPage = new OnboardingSrpPage(driver);
          await onboardingSrpPage.checkPageIsLoaded();

          await onboardingSrpPage.fillSrp(wrongSeedPhrase);
          await onboardingSrpPage.checkSrpError();
          await onboardingSrpPage.checkConfirmSrpButtonIsDisabled();
        },
      );
    },
  );

  pwTest(
    'Verifies error handling when entering an incorrect password during wallet creation',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          const wrongTestPassword = 'wrong horse battery staple test';
          await driver.navigate();

          if (testInfo.project.name === 'firefox-e2e') {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
            await onboardingMetricsPage.skipMetricAndContinue();
          }

          const startOnboardingPage = new StartOnboardingPage(driver);
          await startOnboardingPage.checkLoginPageIsLoaded();
          await startOnboardingPage.createWalletWithSrp();

          const onboardingPasswordPage = new OnboardingPasswordPage(driver);
          await onboardingPasswordPage.checkPageIsLoaded();
          await onboardingPasswordPage.fillWalletPassword(
            WALLET_PASSWORD,
            wrongTestPassword,
          );

          await onboardingPasswordPage.checkIncorrectPasswordWarningMessageIsDisplayed();
          await onboardingPasswordPage.checkConfirmPasswordButtonIsDisabled();
        },
      );
    },
  );

  pwTest(
    'User can add custom network during onboarding',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const networkName = 'Localhost 8546';
      const networkUrl = 'http://127.0.0.1:8546';
      const currencySymbol = 'ETH';
      const port = 8546;
      const chainId = 1338;
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withPreferencesController({
              preferences: {
                showNativeTokenAsMainBalance: true,
              },
            })
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .build(),
          localNodeOptions: [
            {
              type: 'anvil',
            },
            {
              type: 'anvil',
              options: {
                port,
                chainId,
              },
            },
          ],
          unifiedEvmAccountsApiBalances: {
            nativeBalance: '10',
          },
          testSpecificMock: mockCustomNetworkOnboarding,
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver, localNodes }) => {
          await localNodes[1].setAccountBalance(
            IMPORTED_SRP_ACCOUNT_1,
            convertToHexValue(10000000000000000000),
          );
          await importSRPOnboardingFlow({
            driver,
            seedPhrase: TEST_SEED_PHRASE,
          });

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
          await onboardingCompletePage.navigateToDefaultPrivacySettings();

          const onboardingPrivacySettingsPage =
            new OnboardingPrivacySettingsPage(driver);
          await onboardingPrivacySettingsPage.addCustomNetwork(
            networkName,
            chainId,
            currencySymbol,
            networkUrl,
          );
          await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.completeOnboarding();

          await handleSidepanelPostOnboarding(driver);

          const homePage = new HomePage(driver);
          const networkFilter = new NetworkFilter(driver);

          if (await isSidePanelEnabled()) {
            console.log(
              `Skipping toast check for sidepanel build - network '${networkName}' added successfully (verified by network filter)`,
            );
          } else {
            await homePage.checkAddNetworkMessageIsDisplayed(networkName);
          }

          await homePage.checkPageIsLoaded();
          await networkFilter.checkLabelIs(networkName);
        },
      );
    },
  );

  pwTest(
    'User can turn off basic functionality in default settings',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await importSRPOnboardingFlow({ driver });

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
          await onboardingCompletePage.navigateToDefaultPrivacySettings();

          const onboardingPrivacySettingsPage =
            new OnboardingPrivacySettingsPage(driver);
          await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
          await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.completeOnboarding();

          await handleSidepanelPostOnboarding(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'Provides an onboarding path for a user who has restored their account from state persistence failure',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withOnboardingController({
              completedOnboarding: false,
              firstTimeFlowType: FirstTimeFlowType.restore,
              seedPhraseBackedUp: null,
              hasSeenOnboardingCompletionPage: false,
            })
            .withMetaMetricsController({
              consentDecisionMade: false,
              optedIn: false,
              analyticsId: null,
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();
          await loginPage.loginToHomepage();
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          await onboardingMetricsPage.skipMetricAndContinue();

          const secureWalletPage = new SecureWalletPage(driver);
          await secureWalletPage.checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'Navigates to a route using deferred deep link after onboarding completes',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const referringLink =
        'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=KYoYO9beWAlLIT6GUATcHj98hoDiO9h3UZC76ZcMfreKsJcFtCp_vJCWqa9s8-6aO4FLPgoMI02k03t2WcL5bA';
      const expectedPath = '/cross-chain/swaps/';

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withAppStateController({
              deferredDeepLink: {
                createdAt: Date.now(),
                referringLink,
              },
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await importSRPOnboardingFlow({
            driver,
            seedPhrase: TEST_SEED_PHRASE,
          });

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

          await onboardingCompletePage.completeOnboarding();

          let lastUrl = await driver.getCurrentUrl();

          await driver.waitUntil(
            async () => {
              lastUrl = await driver.getCurrentUrl();
              return lastUrl.includes(expectedPath);
            },
            { interval: 200, timeout: 10000 },
          );

          if (!lastUrl.includes(expectedPath)) {
            throw new Error(
              `Expected to navigate to swaps route after onboarding, but current URL was: ${lastUrl}`,
            );
          }
        },
      );
    },
  );

  pwTest(
    'Navigates to an external web page using deferred deep link after onboarding completes',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const referringLink =
        'https://link.metamask.io/buy?address=0xacA92E438df0B2401fF60dA7E4337B687a2435DA&amount=100&chainId=1&sig=aagQN9osZ1tfoYIEKvU6t5i8FVaW4Gi6EGimMcZ0VTDmAlPDk800-Nx3131QlDTmO3UF2JCmR2Y2RAJhceNOYw';
      const expectedUrlOpened =
        'https://app.metamask.io/buy?address=0xacA92E438df0B2401fF60dA7E4337B687a2435DA&amount=100&chainId=1';

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withAppStateController({
              deferredDeepLink: {
                createdAt: Date.now(),
                referringLink,
              },
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await importSRPOnboardingFlow({
            driver,
            seedPhrase: TEST_SEED_PHRASE,
          });

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

          const originalHandle = await driver.getCurrentWindowHandle();

          await onboardingCompletePage.completeOnboarding();

          await driver.waitUntil(
            async () => {
              const handles = await driver.getAllWindowHandles();

              for (const handle of handles) {
                try {
                  await driver.switchToWindow(handle);
                  const url = await driver.getCurrentUrl();
                  if (url.includes(expectedUrlOpened)) {
                    return true;
                  }
                } catch {
                  // ignore
                }
              }

              try {
                await driver.switchToWindow(originalHandle);
              } catch {
                // ignore
              }

              return false;
            },
            { interval: 200, timeout: 10000 },
          );

          const finalHandles = await driver.getAllWindowHandles();
          let foundUrl: string | null = null;

          for (const handle of finalHandles) {
            try {
              await driver.switchToWindow(handle);
              const url = await driver.getCurrentUrl();
              if (url.includes(expectedUrlOpened)) {
                foundUrl = url;
                break;
              }
            } catch {
              // ignore
            }
          }

          if (!foundUrl) {
            throw new Error(
              `Expected to find a tab with URL containing '${expectedUrlOpened}', but none matched.`,
            );
          }
        },
      );
    },
  );

  pwTest(
    'Shows interstitial warning page for unsigned deferred deep link after onboarding completes',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const referringLink =
        'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff';
      const expectedInterstitialPath = '/link';

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withAppStateController({
              deferredDeepLink: {
                createdAt: Date.now(),
                referringLink,
              },
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await importSRPOnboardingFlow({
            driver,
            seedPhrase: TEST_SEED_PHRASE,
          });

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

          await onboardingCompletePage.completeOnboarding();

          let lastUrl = await driver.getCurrentUrl();

          await driver.waitUntil(
            async () => {
              lastUrl = await driver.getCurrentUrl();
              return lastUrl.includes(expectedInterstitialPath);
            },
            { interval: 200, timeout: 10000 },
          );

          if (!lastUrl.includes(expectedInterstitialPath)) {
            throw new Error(
              `Expected to navigate to interstitial page (${expectedInterstitialPath}) for unsigned deep link, but current URL was: ${lastUrl}`,
            );
          }

          await new DeepLink(driver).checkDescriptionTextIsDisplayed(
            'third party',
          );
        },
      );
    },
  );

  pwTest(
    'Shows interstitial warning page for deferred deep link with invalid signature after onboarding completes',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const referringLink =
        'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=aW52YWxpZC1zaWduYXR1cmU=';
      const expectedInterstitialPath = '/link';

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withAppStateController({
              deferredDeepLink: {
                createdAt: Date.now(),
                referringLink,
              },
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await importSRPOnboardingFlow({
            driver,
            seedPhrase: TEST_SEED_PHRASE,
          });

          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
          await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

          await onboardingCompletePage.completeOnboarding();

          let lastUrl = await driver.getCurrentUrl();

          await driver.waitUntil(
            async () => {
              lastUrl = await driver.getCurrentUrl();
              return lastUrl.includes(expectedInterstitialPath);
            },
            { interval: 200, timeout: 10000 },
          );

          if (!lastUrl.includes(expectedInterstitialPath)) {
            throw new Error(
              `Expected to navigate to interstitial page (${expectedInterstitialPath}) for deep link with invalid signature, but current URL was: ${lastUrl}`,
            );
          }

          await new DeepLink(driver).checkDescriptionTextIsDisplayed(
            'third party',
          );
        },
      );
    },
  );

  pwTest(
    'Creates a new wallet and sets up passkey with virtual authenticator during onboarding',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      pwTest.skip(
        testInfo.project.name === 'firefox-e2e',
        'Virtual authenticator is not supported on Firefox',
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({ driver }) => {
          await completeOnboardingWithPasskey({ driver });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('0');
        },
      );
    },
  );

  pwTest(
    'Imports a wallet with SRP and sets up passkey during onboarding',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      pwTest.skip(
        testInfo.project.name === 'firefox-e2e',
        'Virtual authenticator is not supported on Firefox',
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({ driver }) => {
          await completeImportSRPOnboardingWithPasskey({ driver });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();

          await lockAndWaitForPasskeyUnlockPage(driver);

          const loginPage = new LoginPage(driver);
          await loginPage.checkPasskeyUnlockPageIsLoaded();
        },
      );
    },
  );
});
