import { Mockttp } from 'mockttp';
import { toHex } from '@metamask/controller-utils';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import HomePage from '../../page-objects/pages/home/homepage';
import ShieldSubscriptionApprovePage from '../../page-objects/pages/settings/shield/shield-subscription-approve-page';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { ShieldMockttpService } from '../../helpers/shield/mocks';
import { NETWORK_CLIENT_ID } from '../../constants';
import {
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../btc/mocks';
import {
  mockAccountsApiV2SupportedNetworks,
  mockAccountsApiV5MultiaccountBalances,
} from '../solana/mocks/accounts-api';

// Local fixture for card payment tests
function createShieldFixtureCard() {
  return (
    new FixtureBuilderV2()
      // Tokens API mocks (e.g. Navigation tests) populate rates; without this,
      // AggregatedBalance shows fiat and loginWithBalanceValidation never sees "25".
      .withShowNativeTokenAsMainBalanceEnabled()
      .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
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
      .withAssetsController({
        assetsInfo: {
          'eip155:1/slip44:60': {
            aggregators: [],
            decimals: 18,
            image:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
            name: 'Ethereum',
            symbol: 'ETH',
            type: 'native',
          },
        },
        assetsBalance: {
          'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
            'eip155:1/slip44:60': { amount: '25' },
          },
        },
      })
  );
}

// Local fixture for crypto payment tests
function createShieldFixtureCrypto() {
  return (
    new FixtureBuilderV2()
      // Tokens API mocks (e.g. Navigation tests) populate rates; without this,
      // AggregatedBalance shows fiat and loginWithBalanceValidation never sees "25".
      .withShowNativeTokenAsMainBalanceEnabled()
      .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
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
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': toHex(100000000), // 100 USDC (6 decimals)
              '0xdac17f958d2ee523a2206206994597c13d831ec7': toHex(100000000), // 100 USDT (6 decimals)
            },
          },
        },
      })
      .withAssetsController({
        // With assets-unify, virtual token balances + the token list come from
        // `assetsBalance` + `assetsInfo` (see shared/lib/selectors/assets-migration).
        // Rows are skipped if `assetsInfo` is missing for that assetId.
        assetsInfo: {
          'eip155:1/slip44:60': {
            aggregators: [],
            decimals: 18,
            image:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
            name: 'Ethereum',
            symbol: 'ETH',
            type: 'native',
          },
          'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
            aggregators: [],
            decimals: 6,
            image:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
            name: 'USD Coin',
            symbol: 'USDC',
            type: 'erc20',
          },
          'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7': {
            aggregators: [],
            decimals: 6,
            image:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
            name: 'Tether USD',
            symbol: 'USDT',
            type: 'erc20',
          },
        },
        assetsBalance: {
          'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
            'eip155:1/slip44:60': { amount: '25' },
            // ERC-20 keys must match `normalizeAssetId()` (checksummed) or
            // AccountsApiDataSource's filterResponseToKnownAssets drops API updates.
            'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
              amount: '1000',
            },
            'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7': {
              amount: '1000',
            },
          },
        },
      })
  );
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
            await login(driver);

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
            await login(driver);

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
            await login(driver);

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
            testSpecificMock: async (server: Mockttp) => {
              await mockAccountsApiV2SupportedNetworks(server);
              await mockAccountsApiV5MultiaccountBalances(server);
              await mockTokensV2SupportedNetworks(server);
              await mockTokensV3Assets(server);
              const shieldMockttpService = new ShieldMockttpService();
              return shieldMockttpService.setup(server, {
                mockNotEligible: true,
              });
            },
          },
          async ({ driver }) => {
            await login(driver);

            const homePage = new HomePage(driver);
            await homePage.headerNavbar.openSettingsPage();
            const shieldPlanPage = new ShieldPlanPage(driver);

            const settingsPage = new SettingsPage(driver);
            await settingsPage.checkPageIsLoaded();
            await settingsPage.goToTransactionShieldPage();

            await homePage.checkShieldEntryModalIsDisplayed();
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
            testSpecificMock: async (server: Mockttp) => {
              // Accounts API: active chains + v5 balances (see AccountsApiDataSource
              // in @metamask/assets-controller). Fixture `assetsBalance` keys must be
              // checksummed erc20 IDs so filterResponseToKnownAssets keeps updates.
              await mockAccountsApiV2SupportedNetworks(server);
              await mockAccountsApiV5MultiaccountBalances(server);
              await mockTokensV2SupportedNetworks(server);
              await mockTokensV3Assets(server);
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
            await login(driver, { localNode: localNodes[0] });

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
              charges: '80 USDC/year',
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
            testSpecificMock: async (server: Mockttp) => {
              await mockAccountsApiV2SupportedNetworks(server);
              await mockAccountsApiV5MultiaccountBalances(server);
              await mockTokensV2SupportedNetworks(server);
              await mockTokensV3Assets(server);
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
            await login(driver, { localNode: localNodes[0] });

            const homePage = new HomePage(driver);
            await homePage.headerNavbar.openSettingsPage();
            const shieldPlanPage = new ShieldPlanPage(driver);

            const settingsPage = new SettingsPage(driver);
            await settingsPage.checkPageIsLoaded();
            await settingsPage.goToTransactionShieldPage();

            await homePage.checkShieldEntryModalIsDisplayed();
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
              charges: '8 USDC/month',
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
          testSpecificMock: async (server: Mockttp) => {
            await mockTokensV2SupportedNetworks(server);
            await mockTokensV3Assets(server);
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server);
          },
        },
        async ({ driver }) => {
          await login(driver);

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
          testSpecificMock: async (server: Mockttp) => {
            await mockTokensV2SupportedNetworks(server);
            await mockTokensV3Assets(server);
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server, {
              mockNotEligible: true,
            });
          },
        },
        async ({ driver }) => {
          await login(driver);

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
