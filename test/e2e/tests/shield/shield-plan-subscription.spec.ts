import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import HomePage from '../../page-objects/pages/home/homepage';
import ShieldSubscriptionApprovePage from '../../page-objects/pages/settings/shield/shield-subscription-approve-page';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { ShieldMockttpService } from '../../helpers/shield/mocks';

// Local fixture for card payment tests
function createShieldFixtureCard() {
  return new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
      },
    })
    .withTokensController({
      allTokens: {
        '0x1': {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              symbol: 'WETH',
              decimals: 18,
              isERC721: false,
              aggregators: [],
            },
          ],
        },
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
    .withAppStateController({
      showShieldEntryModalOnce: null, // set the initial state to null so that the modal is shown
    });
}

// Local fixture for crypto payment tests
function createShieldFixtureCrypto() {
  return new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
      },
    })
    .withTokensController({
      allTokens: {
        '0x1': {
          // USDC and USDT tokens on Mainnet
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 6,
              isERC721: false,
              aggregators: [],
            },
            {
              address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
              symbol: 'USDT',
              decimals: 6,
              isERC721: false,
              aggregators: [],
            },
          ],
        },
      },
    })
    .withTokenBalancesController({
      tokenBalances: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          '0x1': {
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': '100000000', // 100 USDC (6 decimals)
            '0xdac17f958d2ee523a2206206994597c13d831ec7': '100000000', // 100 USDT (6 decimals)
          },
        },
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
    .withAppStateController({
      showShieldEntryModalOnce: null, // set the initial state to null so that the modal is shown
    });
}

describe('Shield Subscription Tests', function () {
  describe('Card Payment', function () {
    describe('Shield Entry Modal', function () {
      it('should subscribe to the shield plan from the entry modal - annual plan', async function () {
        await withFixtures(
          {
            fixtures: createShieldFixtureCard().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: (server: Mockttp) => {
              const shieldMockttpService = new ShieldMockttpService();
              return shieldMockttpService.setup(server);
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            const homePage = new HomePage(driver);

            await homePage.checkShieldEntryModalIsDisplayed();
            await homePage.clickOnShieldEntryModalGetStarted();

            const shieldPlanPage = new ShieldPlanPage(driver);
            await shieldPlanPage.completeShieldPlanSubscriptionFlow(
              'annual',
              'card',
            );

            const shieldDetailPage = new ShieldDetailPage(driver);
            await shieldDetailPage.validateShieldDetailPage();
          },
        );
      });

      it('should subscribe to the shield plan from the entry modal - monthly plan', async function () {
        await withFixtures(
          {
            fixtures: createShieldFixtureCard().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: (server: Mockttp) => {
              const shieldMockttpService = new ShieldMockttpService();
              return shieldMockttpService.setup(server);
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            const homePage = new HomePage(driver);

            await homePage.checkShieldEntryModalIsDisplayed();
            await homePage.clickOnShieldEntryModalGetStarted();

            const shieldPlanPage = new ShieldPlanPage(driver);
            await shieldPlanPage.completeShieldPlanSubscriptionFlow(
              'monthly',
              'card',
            );

            const shieldDetailPage = new ShieldDetailPage(driver);
            await shieldDetailPage.validateShieldDetailPage();
          },
        );
      });
    });

    describe('Shield Settings Subscription', function () {
      it('should subscribe to the shield plan from the settings > shield - annual plan', async function () {
        await withFixtures(
          {
            fixtures: createShieldFixtureCard().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: (server: Mockttp) => {
              const shieldMockttpService = new ShieldMockttpService();
              return shieldMockttpService.setup(server, {
                mockNotEligible: true,
              });
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            const homePage = new HomePage(driver);
            await homePage.headerNavbar.openSettingsPage();
            const shieldPlanPage = new ShieldPlanPage(driver);

            const settingsPage = new SettingsPage(driver);
            await settingsPage.checkPageIsLoaded();
            await settingsPage.goToTransactionShieldPage();

            await homePage.checkShieldEntryModalIsDisplayed();
            await homePage.clickOnShieldEntryModalGetStarted();

            await shieldPlanPage.completeShieldPlanSubscriptionFlow(
              'annual',
              'card',
            );

            const shieldDetailPage = new ShieldDetailPage(driver);
            await shieldDetailPage.validateShieldDetailPage();
          },
        );
      });

      it('should subscribe to the shield plan from the settings > shield - monthly plan', async function () {
        await withFixtures(
          {
            fixtures: createShieldFixtureCard().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: (server: Mockttp) => {
              const shieldMockttpService = new ShieldMockttpService();
              return shieldMockttpService.setup(server, {
                mockNotEligible: true,
              });
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            const homePage = new HomePage(driver);
            await homePage.headerNavbar.openSettingsPage();
            const shieldPlanPage = new ShieldPlanPage(driver);

            const settingsPage = new SettingsPage(driver);
            await settingsPage.checkPageIsLoaded();
            await settingsPage.goToTransactionShieldPage();

            await homePage.clickOnShieldEntryModalGetStarted();
            await shieldPlanPage.completeShieldPlanSubscriptionFlow(
              'monthly',
              'card',
            );

            const shieldDetailPage = new ShieldDetailPage(driver);
            await shieldDetailPage.validateShieldDetailPage();
          },
        );
      });
    });
  });

  describe('Crypto Payment', function () {
    describe('Shield Entry Modal', function () {
      it('should get started on entry modal - annual plan', async function () {
        await withFixtures(
          {
            fixtures: createShieldFixtureCrypto().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: (server: Mockttp) => {
              const shieldMockttpService = new ShieldMockttpService();
              return shieldMockttpService.setup(server);
            },
            localNodeOptions: [
              {
                type: 'anvil',
                options: {
                  chainId: 1,
                  loadState:
                    './test/e2e/seeder/network-states/with100Usdc100Usdt.json',
                },
              },
            ],
          },
          async ({ driver, localNodes }) => {
            await loginWithBalanceValidation(driver, localNodes[0]);

            const homePage = new HomePage(driver);

            await homePage.checkShieldEntryModalIsDisplayed();
            await homePage.clickOnShieldEntryModalGetStarted();

            const shieldPlanPage = new ShieldPlanPage(driver);
            await shieldPlanPage.checkPageIsLoaded();

            await shieldPlanPage.completeShieldPlanSubscriptionFlow(
              'annual',
              'crypto',
            );

            const shieldSubscriptionApprovePage =
              new ShieldSubscriptionApprovePage(driver);
            await shieldSubscriptionApprovePage.checkPageIsLoaded();
            await shieldSubscriptionApprovePage.clickStartNowButton();

            const shieldDetailPage = new ShieldDetailPage(driver);
            await shieldDetailPage.checkPageIsLoaded();
            await shieldDetailPage.validateShieldDetailPage({
              charges: '80 USDC (Annual)',
              nextBillingDate: 'Nov 3, 2025',
              paymentMethod: 'USDC',
            });
          },
        );
      });
    });

    describe('Shield Settings Subscription', function () {
      it('should subscribe to the shield plan from the settings > shield - monthly plan', async function () {
        await withFixtures(
          {
            fixtures: createShieldFixtureCrypto().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: (server: Mockttp) => {
              const shieldMockttpService = new ShieldMockttpService();
              return shieldMockttpService.setup(server, {
                mockNotEligible: true,
              });
            },
            localNodeOptions: [
              {
                type: 'anvil',
                options: {
                  chainId: 1,
                  loadState:
                    './test/e2e/seeder/network-states/with100Usdc100Usdt.json',
                },
              },
            ],
          },
          async ({ driver, localNodes }) => {
            await loginWithBalanceValidation(driver, localNodes[0]);

            const homePage = new HomePage(driver);
            await homePage.headerNavbar.openSettingsPage();
            const shieldPlanPage = new ShieldPlanPage(driver);

            const settingsPage = new SettingsPage(driver);
            await settingsPage.checkPageIsLoaded();
            await settingsPage.goToTransactionShieldPage();

            await homePage.clickOnShieldEntryModalGetStarted();
            await shieldPlanPage.completeShieldPlanSubscriptionFlow(
              'monthly',
              'crypto',
            );

            const shieldSubscriptionApprovePage =
              new ShieldSubscriptionApprovePage(driver);
            await shieldSubscriptionApprovePage.checkPageIsLoaded();
            await shieldSubscriptionApprovePage.clickStartNowButton();

            const shieldDetailPage = new ShieldDetailPage(driver);
            await shieldDetailPage.checkPageIsLoaded();
            await shieldDetailPage.validateShieldDetailPage({
              charges: '8 USDC (Monthly)',
              nextBillingDate: 'Nov 20, 2025',
              paymentMethod: 'USDC',
            });
          },
        );
      });
    });
  });

  describe('Navigation Tests', function () {
    it('should shield-plan page redirect to homepage when user clicks back button', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixtureCard().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server);
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          const shieldPlanPage = new ShieldPlanPage(driver);
          await shieldPlanPage.clickBackButton();

          await homePage.checkPageIsLoaded();
        },
      );
    });

    it('should shield-plan page redirect to settings page when user clicks back button', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixtureCard().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server, {
              mockNotEligible: true,
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);

          await homePage.headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          const shieldPlanPage = new ShieldPlanPage(driver);
          await shieldPlanPage.clickBackButton();

          await settingsPage.checkPageIsLoaded();
        },
      );
    });
  });
});
