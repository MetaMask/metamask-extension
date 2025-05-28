import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '../../../../shared/constants/network';

describe('Monad Network Connection Tests', function (this: Suite) {
  it('should connect dapp to Monad network and verify Monad network and tokens', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkController({
            selectedNetworkClientId: 'monad-testnet',
            networkConfigurations: {
              'monad-testnet': {
                chainId: CHAIN_IDS.MONAD_TESTNET,
                nickname: 'Monad Testnet',
                rpcUrl: 'https://testnet-rpc.monad.xyz',
                ticker: 'MON',
                rpcPrefs: {
                  blockExplorerUrl: 'https://testnet.monadexplorer.com',
                },
                id: 'monad-testnet',
                type: 'rpc',
                isCustom: true,
              },
            },
          })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Verify network is selected
        await driver.waitForSelector({
          css: 'p',
          text: 'Monad Testnet',
        });

        // Verify MON is displayed
        await driver.waitForSelector({
          css: 'span',
          text: 'MON',
        });
        await driver.waitForSelector({
          css: '[data-testid="multichain-token-list-item-token-name"]',
          text: 'MON',
        });

        // Open the test dapp and verify balance
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Verify dapp can access the account
        await testDapp.check_getAccountsResult(
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );

        // Click Send button on Dapp and verify network on extension matches
        await driver.clickElement('#sendButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: 'p',
          text: 'Monad Testnet',
        });
      },
    );
  });
});
