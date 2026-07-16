import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { mockTronApis } from './mocks/common-tron';

describe('Check balance', function (this: Suite) {
  it('Just created Tron account shows 0 TRX when native token is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockTronApis(mockServer, true),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '0 TRX',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });

  it('For a non 0 balance account - USD balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        await driver.refresh();

        // TRX_BALANCE = 106072392 SUN = ~106.07 TRX * $0.29469 = ~$31.26
        // Total Fiat = TRX $31.26, HTX DAO $5.30, USDT $2.80, USDD $0.29 = $39.65
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '$39.65',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });

  it('For a non 0 balance account - TRX balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        await driver.refresh();

        // TRX_BALANCE = 106072392 SUN = ~106.07 TRX
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '106.072 TRX',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });
});
