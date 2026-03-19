import { strict as assert } from 'assert';
import { WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { Driver } from '../webdriver/driver';
import LoginPage from '../page-objects/pages/login-page';
import ConnectAccountConfirmation from '../page-objects/pages/confirmations/connect-account-confirmation';
import TestDapp from '../page-objects/pages/test-dapp';

describe('eth_requestAccounts', function () {
  it('returns permitted accounts when there are permitted accounts and the wallet is unlocked', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // eth_requestAccounts
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const requestAccountRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_requestAccounts',
        });

        const requestAccount: string[] = await driver.executeScript(
          `return window.ethereum.request(${requestAccountRequest})`,
        );

        assert.deepStrictEqual(requestAccount, [
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        ]);
      },
    );
  });

  it('returns permitted accounts when there are permitted accounts and the wallet is locked', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // eth_requestAccounts
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const requestAccountRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_requestAccounts',
        });

        const requestAccount: string[] = await driver.executeScript(
          `return window.ethereum.request(${requestAccountRequest})`,
        );

        assert.deepStrictEqual(requestAccount, [
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        ]);
      },
    );
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  for (let i = 0; i < 5; i++) {
    it(`prompts for login when there are no permitted accounts and the wallet is locked (run ${i + 1})`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          const requestAccountRequest: string = JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_requestAccounts',
          });

          await driver.executeScript(
            `window.requestAccount = window.ethereum.request(${requestAccountRequest})`,
          );

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await loginPage.checkPageIsLoaded();
          await loginPage.loginToHomepage();

          // Wait for SnapController.isReady so the permission grant does not reject non-EVM accounts
          await driver.wait(async () => {
            const uiState = await driver.executeScript(() =>
              (
                window as {
                  stateHooks?: { getCleanAppState?: () => Promise<unknown> };
                }
              ).stateHooks?.getCleanAppState?.(),
            );
            return uiState?.metamask?.isReady === true;
          }, 30000);

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.confirmConnect();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.checkPageIsLoaded();

          const requestAccount = await driver.executeScript(
            `return window.requestAccount;`,
          );

          assert.deepStrictEqual(requestAccount, [
            '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          ]);
        },
      );
    });
  }
});
