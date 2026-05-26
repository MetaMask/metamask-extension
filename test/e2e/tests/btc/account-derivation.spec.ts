import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  EXPECTED_BTC_ADDRESSES_BY_INDEX,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { Driver } from '../../webdriver/driver';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

async function mockBtcAccountDerivationMocks(mockServer: Mockttp) {
  return [
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
  ];
}

describe('Bitcoin account derivation', function (this: Suite) {
  this.timeout(240_000);

  it("shows Account 1's Bitcoin address on the Addresses modal", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAccountDerivationMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountList.clickMultichainAccountMenuItem('Addresses');

        await addressList.checkPageIsLoaded();
        await addressList.checkNetworkNameisDisplayed('Bitcoin');
        await addressList.checkNetworkAddressIsDisplayed(
          shortenAddress(DEFAULT_BTC_ADDRESS),
        );
      },
    );
  });

  it("shows Account 1's Bitcoin address on the Receive page", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAccountDerivationMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');

        const bitcoinHomepage = new BitcoinHomepage(driver);
        const addressList = new AddressListModal(driver);

        await bitcoinHomepage.checkPageIsLoaded();
        await bitcoinHomepage.clickOnReceiveButton();

        await addressList.checkPageIsLoaded();
        await addressList.checkNetworkAddressIsDisplayed(
          shortenAddress(DEFAULT_BTC_ADDRESS),
        );
      },
    );
  });

  it('derives Bitcoin addresses while adding multichain accounts from Account 1 to Account 8', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAccountDerivationMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expected = EXPECTED_BTC_ADDRESSES_BY_INDEX[index];

          if (index > 0) {
            await accountList.addMultichainAccount();
            await accountList.checkMultichainAccountNameDisplayed(accountLabel);
          }

          await accountList.openMultichainAccountMenu({ accountLabel });
          await accountList.clickMultichainAccountMenuItem('Addresses');
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkNameisDisplayed('Bitcoin');
          await addressList.checkNetworkAddressIsDisplayed(
            shortenAddress(expected),
          );
          await addressList.goBack();
        }

        await accountList.closeMultichainAccountsPage();
      },
    );
  });

  it("shows Account 1's Bitcoin address on the quick-copy popover", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAccountDerivationMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');

        const homepage = new HomePage(driver);
        const addressList = new AddressListModal(driver);

        await homepage.headerNavbar.clickNetworkAddresses();
        await addressList.checkQuickCopyPopoverIsLoaded();
        await addressList.checkQuickCopyAddressIsDisplayedForNetwork({
          networkName: 'Bitcoin',
          networkAddress: shortenAddress(DEFAULT_BTC_ADDRESS),
        });
      },
    );
  });
});
