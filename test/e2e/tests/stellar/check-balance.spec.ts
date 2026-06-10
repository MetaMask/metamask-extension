import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { mockStellarApis } from './mocks/common-stellar';

function buildStellarFixture(
  builder: FixtureBuilderV2 = new FixtureBuilderV2(),
) {
  return builder
    .withEnabledNetworks({
      stellar: {
        [MultichainNetworks.STELLAR]: true,
        [MultichainNetworks.STELLAR_TESTNET]: true,
      },
      eip155: {
        '0x539': true,
      },
    })
    .build();
}

describe('Check balance', function (this: Suite) {
  it('Just created Stellar account shows 0 XLM when native token is enabled', async function () {
    await withFixtures(
      {
        fixtures: buildStellarFixture(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockStellarApis(mockServer, true),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Stellar');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0 XLM');
      },
    );
  });

  it('For a non 0 balance account - USD balance', async function () {
    await withFixtures(
      {
        fixtures: buildStellarFixture(
          new FixtureBuilderV2().withShowNativeTokenAsMainBalanceDisabled(),
        ),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStellarApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Stellar');

        const homePage = new HomePage(driver);
        // XLM_BALANCE = 60723920 stroops = ~6.07 XLM * $0.12 = ~$0.73
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('$0.73');
      },
    );
  });

  it('For a non 0 balance account - XLM balance', async function () {
    await withFixtures(
      {
        fixtures: buildStellarFixture(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStellarApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Stellar');

        const homePage = new HomePage(driver);
        // XLM_BALANCE = 60723920 stroops = ~6.07 XLM
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('6.072 XLM');
      },
    );
  });
});
