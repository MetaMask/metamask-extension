import assert from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures, isSidePanelEnabled } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AccountList from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import {
  importSRPOnboardingFlow,
  completeImportSRPOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import { mockSpotPrices } from '../tokens/utils/mocks';

async function mockApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  // Mock feature flags API to prevent Redux initialization issues
  await mockServer
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .thenCallback(() => ({
      statusCode: 200,
      json: [{}],
    }));

  // Mock Infura RPC endpoints for mainnet
  const infuraPattern = /mainnet\.infura\.io/u;
  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_blockNumber' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '0x1234567' },
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '0x15af1d78b58c40000' }, // 25 ETH
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_chainId' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '0x1' },
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'net_version' })
    .thenCallback(() => ({
      statusCode: 200,
      json: { jsonrpc: '2.0', id: 1, result: '1' },
    }));

  await mockServer
    .forPost(infuraPattern)
    .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: 1,
        result: {
          number: '0x1234567',
          hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: '0x64',
          baseFeePerGas: '0x7',
        },
      },
    }));

  // Mock gas API
  await mockServer
    .forGet('https://gas.api.cx.metamask.io/v1/supportedNetworks')
    .thenCallback(() => ({
      statusCode: 200,
      json: ['0x1'],
    }));

  return [
    await mockServer
      .forGet('https://token.api.cx.metamask.io/tokens/1')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    await mockServer
      .forGet('https://on-ramp-content.api.cx.metamask.io/regions/networks')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    await mockServer
      .forGet('https://chainid.network/chains.json')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [{ fakedata: true }],
        };
      }),
    await mockSpotPrices(mockServer, {
      'eip155:1/slip44:60': {
        price: 1700,
        marketCap: 382623505141,
        pricePercentChange1d: 0,
      },
    }),
    // TODO: Enable this mock once bug #32312 is resolved: https://github.com/MetaMask/metamask-extension/issues/32312
    /*
    await mockServer
      .forGet('https://accounts.api.cx.metamask.io/v2/activeNetworks')
      .thenCallback(() => ({
        statusCode: 200,
        json: [{ fakedata: true }]
      })),
    */
  ];
}
describe('MetaMask onboarding ', function () {
  it('should prevent network requests to advanced functionality endpoints when the advanced assets functionality toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .withPreferencesControllerShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })

          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }) => {
        await importSRPOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.toggleAssetsSettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        // Refresh tokens before asserting to mitigate flakiness
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed();
        await homePage.refreshErc20TokenList();
        await homePage.checkPageIsLoaded();

        for (const m of mockedEndpoint) {
          const requests = await m.getSeenRequests();
          assert.ok(
            requests.length === 0,
            `${m} should not make requests after onboarding`,
          );
        }
      },
    );
  });

  it('should not prevent network requests to advanced functionality endpoints when the advanced assets functionality toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .withPreferencesControllerShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .withAccountTracker({
            accountsByChainId: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                  balance: '0x15af1d78b58c40000', // 25 ETH
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint }) => {
        await completeImportSRPOnboardingFlow({ driver });

        // Refresh tokens before asserting to mitigate flakiness
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');
        await homePage.refreshErc20TokenList();
        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.openAccountMenu();
        await new AccountList(driver).checkPageIsLoaded();

        // Check if sidepanel is enabled
        const hasSidepanel = await isSidePanelEnabled();

        // intended delay to allow for network requests to complete
        await driver.delay(1000);
        for (const m of mockedEndpoint) {
          const requests = await m.getSeenRequests();
          const mockUrl = m.toString();

          if (hasSidepanel) {
            // Skip assertion for sidepanel builds - cannot accurately count requests
            // when sidepanel loads home.html in parallel with the main test window
            console.log(
              `Skipping request count assertion for sidepanel build - ${m}`,
            );
            continue;
          }

          // Spot-prices endpoint may be called multiple times (initial load + refresh)
          if (mockUrl.includes('spot-prices')) {
            assert.ok(
              requests.length >= 1,
              `${m} should make at least 1 request after onboarding (actual: ${requests.length})`,
            );
          } else {
            assert.equal(
              requests.length,
              1,
              `${m} should make requests after onboarding`,
            );
          }
        }
      },
    );
  });
});
