import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_ADDRESS } from '../../constants';
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
  this.timeout(180_000);

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
});
