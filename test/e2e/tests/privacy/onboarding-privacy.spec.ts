const { strict: assert } = require('assert');
const {
  convertToHexValue,
  WALLET_PASSWORD,
  withFixtures,
  importSRPOnboardingFlow,
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
} = require('../../helpers');

import type { WithFixturesOptions, Fixtures } from '../../helpers';
import type { Driver } from '../../webdriver/driver';
import type { Mockttp, MockedEndpoint } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import HomePage from '../../page-objects/pages/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import OnboardingSrpPage from '../../page-objects/pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

describe('MetaMask onboarding @no-mmi', function () {
  // First test: Network requests check
  it("doesn't make any network requests to infura before onboarding is completed", async function () {
    // Mock function implementation for Infura requests
    async function mockInfura(mockServer: Mockttp): Promise<MockedEndpoint[]> {
      const infuraUrl = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
      const sampleAddress = '1111111111111111111111111111111111111111';

      return [
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_blockNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x1',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBalance' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x0',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: {},
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_call' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: `0x000000000000000000000000${sampleAddress}`,
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'net_version' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: { id: 8262367391254633, jsonrpc: '2.0', result: '1337' },
            };
          }),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: {
          accounts: [
            {
              secretKey: '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
              balance: convertToHexValue(10000000000000000000),
            },
          ],
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      } as WithFixturesOptions,
      async ({ driver, mockedEndpoint: mockedEndpoints }: Fixtures) => {
        const startOnboardingPage = new StartOnboardingPage(driver);
        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(driver);
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        const homePage = new HomePage(driver);

        await driver.navigate();
        await startOnboardingPage.check_pageIsLoaded();
        await startOnboardingPage.checkTermsCheckbox();
        await startOnboardingPage.clickCreateWalletButton();

        await onboardingMetricsPage.check_pageIsLoaded();
        await onboardingMetricsPage.clickNoThanksButton();

        await onboardingPasswordPage.check_pageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.check_walletReadyMessageIsDisplayed();

        // Check no requests are made before completing onboarding
        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];
          const isPending = await mockedEndpoint.isPending();
          assert.equal(
            isPending,
            true,
            `${mockedEndpoints[i]} mock should still be pending before onboarding`,
          );
          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length,
            0,
            `${mockedEndpoints[i]} should make no requests before onboarding`,
          );
        }

        await onboardingCompletePage.completeOnboarding();
        // requests happen here!

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];

          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, driver.timeout);

          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length > 0,
            true,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });

  it("doesn't make any network requests to infura before onboarding by import is completed", async function () {
    async function mockInfura(mockServer: Mockttp): Promise<MockedEndpoint[]> {
      const infuraUrl = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
      const sampleAddress = '1111111111111111111111111111111111111111';

      return [
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_blockNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x1',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBalance' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x0',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: {},
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_call' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: `0x000000000000000000000000${sampleAddress}`,
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'net_version' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: { id: 8262367391254633, jsonrpc: '2.0', result: '1337' },
            };
          }),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: {
          accounts: [
            {
              secretKey: '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
              balance: convertToHexValue(10000000000000000000),
            },
          ],
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      } as WithFixturesOptions,
      async ({ driver, mockedEndpoint: mockedEndpoints }: Fixtures) => {
        // Check no requests before completing onboarding
        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];
          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length,
            0,
            `${mockedEndpoints[i]} should make no requests before onboarding`,
          );
        }

        await importSRPOnboardingFlow(driver);

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.headerNavbar.findAccountMenuIcon();
        // requests happen here!

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];

          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, driver.timeout);

          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length > 0,
            true,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });
});
