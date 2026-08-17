import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import {
  createNewWalletWithSocialLoginOnboardingFlow,
  importWalletWithSocialLoginOnboardingFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
  MOCK_GOOGLE_ACCOUNT,
  MOCK_GOOGLE_ACCOUNT_WALLET_ADDRESS,
  MOCK_TELEGRAM_ACCOUNT,
  MOCK_TELEGRAM_ACCOUNT_WALLET_ADDRESS,
} from '../../constants';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { AuthConnection } from '../../../../shared/constants/onboarding';

const ETH_MAINNET_ASSET_ID = 'eip155:1/slip44:60';
const MUSD_MAINNET_ASSET_ID =
  'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

/**
 * Mocks Accounts API + Price API responses needed for homepage balance to render
 * after social-login import (ETH native + mUSD price requests).
 *
 * @param mockServer
 */
async function mockSeedlessOnboardingBalanceApis(
  mockServer: Mockttp,
): Promise<void> {
  await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
    .always()
    .thenJson(200, {
      fullSupport: [1, 137, 56, 59144, 8453, 10, 42161, 534352],
      partialSupport: {
        balances: [42220, 43114],
      },
    });

  await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v5/multiaccount/balances')
    .always()
    .thenCallback((request) => {
      const accountIds = (
        new URL(request.url).searchParams.get('accountIds') ?? ''
      )
        .split(',')
        .filter(Boolean);

      const balances = accountIds.flatMap((accountId) => {
        const [, chainRef] = accountId.split(':');
        const slip44 = chainRef === '1337' ? '1' : '60';
        return [
          {
            accountId,
            assetId: `eip155:${chainRef}/slip44:${slip44}`,
            balance: '25',
          },
        ];
      });

      return {
        statusCode: 200,
        json: {
          count: balances.length,
          balances,
          unprocessedNetworks: [],
        },
      };
    });

  // Homepage requests ETH + mUSD together; exact-match mocks in mock-e2e miss this.
  await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .always()
    .thenCallback((request) => {
      const assetIds = (new URL(request.url).searchParams.get('assetIds') ?? '')
        .split(',')
        .filter(Boolean);

      const json: Record<
        string,
        {
          id: string;
          price: number;
          marketCap: number;
          pricePercentChange1d: number;
        }
      > = {};

      for (const assetId of assetIds) {
        const normalized = assetId.toLowerCase();
        if (
          normalized === ETH_MAINNET_ASSET_ID.toLowerCase() ||
          normalized.includes('/slip44:60') ||
          normalized.includes('/slip44:1')
        ) {
          json[assetId] = {
            id: 'ethereum',
            price: 3010,
            marketCap: 382623505141,
            pricePercentChange1d: 0,
          };
        } else if (
          normalized === MUSD_MAINNET_ASSET_ID.toLowerCase() ||
          normalized.includes('0xaca92e438df0b2401ff60da7e4337b687a2435da')
        ) {
          json[assetId] = {
            id: 'musd',
            price: 1,
            marketCap: 35_000_000_000,
            pricePercentChange1d: 0,
          };
        }
      }

      return { statusCode: 200, json };
    });
}

describe('Metamask onboarding (with social login)', function () {
  it('Creates a new wallet with Google login and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await createNewWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.displayDownloadAppPageAndContinue();
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
      },
    );
  });

  it('Creates a new wallet with Telegram login and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await createNewWalletWithSocialLoginOnboardingFlow({
          driver,
          authConnection: AuthConnection.Telegram,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.displayDownloadAppPageAndContinue();
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
      },
    );
  });

  it('Imports an existing wallet with Google login and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
          await mockSeedlessOnboardingBalanceApis(server);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '25',
          symbol: 'ETH',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);

        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountListPage.clickMultichainAccountMenuItem('Addresses');
        const addressListModal = new AddressListModal(driver);
        await addressListModal.checkNetworkAddressIsDisplayed(
          shortenAddress(
            normalizeSafeAddress(MOCK_GOOGLE_ACCOUNT_WALLET_ADDRESS),
          ),
        );
      },
    );
  });

  it('Imports an existing wallet with Telegram login and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_TELEGRAM_ACCOUNT,
          });
          await mockSeedlessOnboardingBalanceApis(server);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
          authConnection: AuthConnection.Telegram,
        });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '25',
          symbol: 'ETH',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);

        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountListPage.clickMultichainAccountMenuItem('Addresses');
        const addressListModal = new AddressListModal(driver);
        await addressListModal.checkNetworkAddressIsDisplayed(
          shortenAddress(
            normalizeSafeAddress(MOCK_TELEGRAM_ACCOUNT_WALLET_ADDRESS),
          ),
        );
      },
    );
  });
});
