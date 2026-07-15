import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { mockTronApis } from './mocks/common-tron';
import { buildTronFixtures } from './unified-tron-assets';

describe('Check balance', function (this: Suite) {
  it('Just created Tron account shows 0 TRX when native token is enabled', async function () {
    await withFixtures(
      {
        fixtures: buildTronFixtures(undefined, { zeroBalance: true }),
        localNodeOptions: [{ type: 'none' as const }],
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockTronApis(mockServer, true),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        // The Snap balance can lag a single refresh, so retry the refresh + assert cycle.
        await homePage.refreshUntilExpectedBalanceIsDisplayed({
          expectedBalance: '0 TRX',
        });
      },
    );
  });

  it('For a non 0 balance account - USD balance', async function () {
    await withFixtures(
      {
        fixtures: buildTronFixtures(undefined, {
          showNativeTokenAsMainBalanceDisabled: true,
        }),
        localNodeOptions: [{ type: 'none' as const }],
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        // The Snap balance can lag a single refresh, so retry the refresh + assert cycle.
        // TRX_BALANCE = 106072392 SUN = ~106.07 TRX * $0.29469 = ~$31.26
        // Total Fiat = TRX $31.26, HTX DAO $5.30, USDT $2.80, USDD $0.29 = $39.65
        await homePage.refreshUntilExpectedBalanceIsDisplayed({
          expectedBalance: '$39.65',
        });
      },
    );
  });

  it('For a non 0 balance account - TRX balance', async function () {
    await withFixtures(
      {
        fixtures: buildTronFixtures(),
        localNodeOptions: [{ type: 'none' as const }],
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        // The Snap balance can lag a single refresh, so retry the refresh + assert cycle.
        // TRX_BALANCE = 106072392 SUN = ~106.07 TRX
        await homePage.refreshUntilExpectedBalanceIsDisplayed({
          expectedBalance: '106.072 TRX',
        });
      },
    );
  });
});
