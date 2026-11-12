import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import {
  DEFAULT_STELLAR_ADDRESS,
  HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import AccountAddressListPage from '../../page-objects/pages/accounts/address-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { Driver } from '../../webdriver/driver';
import {
  STELLAR_NETWORK_NAME,
  XLM_FIAT_DISPLAY,
  buildStellarFixture,
  mockStellarApis,
  mockStellarApisZeroBalance,
  stellarFixtureOptions,
} from './mocks/common-stellar';

async function mockStellarDerivationMocks(mockServer: Mockttp) {
  return mockStellarApisZeroBalance(mockServer);
}

describe('Stellar account derivation', function (this: Suite) {
  this.timeout(180_000);

  it("shows Account 1's Stellar address on the Addresses modal", async function () {
    await withFixtures(
      stellarFixtureOptions({
        fixtures: buildStellarFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStellarDerivationMocks,
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountList.clickMultichainAccountMenuItem('Addresses');

        await addressList.checkPageIsLoaded();
        await addressList.checkNetworkAddressIsDisplayedForNetwork({
          networkName: STELLAR_NETWORK_NAME,
          networkAddress: shortenAddress(DEFAULT_STELLAR_ADDRESS),
        });
      },
    );
  });

  it("shows Account 1's Stellar address on the Receive page", async function () {
    await withFixtures(
      stellarFixtureOptions({
        fixtures: buildStellarFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStellarDerivationMocks,
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homepage = new HomePage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.checkPageIsLoaded();
        // Homepage More collapses to a single Receive control (`*-overview-default`).
        await homepage.clickOnReceiveButton('default');

        await addressList.checkPageIsLoaded();
        await addressList.checkNetworkAddressIsDisplayedForNetwork({
          networkName: STELLAR_NETWORK_NAME,
          networkAddress: shortenAddress(DEFAULT_STELLAR_ADDRESS),
        });
      },
    );
  });

  it('derives a Stellar address after importing an SRP', async function () {
    await withFixtures(
      stellarFixtureOptions({
        fixtures: buildStellarFixture({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) => mockStellarApis(mockServer),
      }),
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          fillSrpWordByWord: true,
        });

        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        // Account-tree identity sync is not mocked here and is not required for
        // Stellar derivation; selectStellarNetwork waits for the snap account.
        await selectStellarNetwork(driver);

        // Refresh re-hydrates UI after Snap account alignment / Horizon sync.
        // Fresh onboarding defaults the homepage primary balance to fiat.
        await driver.refresh();
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed({
          expectedBalance: XLM_FIAT_DISPLAY,
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });

        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountList.clickMultichainAccountMenuItem('Addresses');

        await addressList.checkPageIsLoaded();
        await addressList.checkNetworkAddressIsDisplayedForNetwork({
          networkName: STELLAR_NETWORK_NAME,
          networkAddress: shortenAddress(DEFAULT_STELLAR_ADDRESS),
        });
      },
    );
  });
});
