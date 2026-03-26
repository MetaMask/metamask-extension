import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
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
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });
      },
    );
  });

  it('For a non 0 balance account - USD balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withAssetsController({
            assetsBalance: {
              '04b514a4-c0a0-4fbf-ab11-7dbca387025f': {
                'tron:728126428/slip44:195': {
                  amount: '6.072392',
                },
                'tron:3448148188/slip44:195': {
                  amount: '0',
                },
                'tron:2494104990/slip44:195': {
                  amount: '0',
                },
                'tron:728126428/slip44:195-staked-for-bandwidth': {
                  amount: '0',
                },
                'tron:3448148188/slip44:195-staked-for-bandwidth': {
                  amount: '0',
                },
                'tron:2494104990/slip44:195-staked-for-bandwidth': {
                  amount: '0',
                },
                'tron:728126428/slip44:195-staked-for-energy': {
                  amount: '20',
                },
                'tron:3448148188/slip44:195-staked-for-energy': {
                  amount: '0',
                },
                'tron:2494104990/slip44:195-staked-for-energy': {
                  amount: '0',
                },
                'tron:728126428/slip44:bandwidth': {
                  amount: '600',
                },
                'tron:3448148188/slip44:bandwidth': {
                  amount: '0',
                },
                'tron:2494104990/slip44:bandwidth': {
                  amount: '0',
                },
                'tron:728126428/slip44:maximum-bandwidth': {
                  amount: '600',
                },
                'tron:3448148188/slip44:maximum-bandwidth': {
                  amount: '0',
                },
                'tron:2494104990/slip44:maximum-bandwidth': {
                  amount: '0',
                },
                'tron:728126428/slip44:energy': {
                  amount: '189',
                },
                'tron:3448148188/slip44:energy': {
                  amount: '0',
                },
                'tron:2494104990/slip44:energy': {
                  amount: '0',
                },
                'tron:728126428/slip44:maximum-energy': {
                  amount: '189',
                },
                'tron:3448148188/slip44:maximum-energy': {
                  amount: '0',
                },
                'tron:2494104990/slip44:maximum-energy': {
                  amount: '0',
                },
                'tron:728126428/trc20:TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6': {
                  amount: '3156454.956836360132407885',
                },
                'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t': {
                  amount: '2.804595',
                },
                'tron:728126428/trc20:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz': {
                  amount: '0.289757448699320931',
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        // TRX_BALANCE = 6072392 SUN = ~6.07 TRX * $0.29469 = ~$1.79
        await nonEvmHomePage.checkPageIsLoaded({ amount: '$10.18' });
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
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        // TRX_BALANCE = 6072392 SUN = ~6.07 TRX
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
      },
    );
  });
});
