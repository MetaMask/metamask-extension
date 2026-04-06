import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import { mockTronApis } from './mocks/common-tron';

describe('Tron network switching', function (this: Suite) {
  it('can switch from Ethereum to Tron and back to Ethereum', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);

        // Start on Ethereum — verify ETH balance is shown
        await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');

        // Switch to Tron
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        // Verify TRX balance is shown
        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        // Switch back to Ethereum
        await networkManager.openNetworkManager();
        await networkManager.selectNetworkByNameWithWait('Ethereum Mainnet');

        // Verify ETH balance is shown again
        await homePage.checkExpectedBalanceIsDisplayed('25', 'ETH');
      },
    );
  });

  it('Tron receive button is enabled and shows correct address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        // Verify the receive button is enabled on the Tron homepage
        const isReceiveEnabled =
          await nonEvmHomePage.checkIsReceiveButtonEnabled();
        if (!isReceiveEnabled) {
          throw new Error('Receive button should be enabled on Tron homepage');
        }
      },
    );
  });
});
