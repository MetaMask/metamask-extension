import { strict as assert } from 'assert';
import { WINDOW_TITLES, withFixtures } from '../helpers';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { WindowHandles } from '../background-socket/window-handles';
import LoginPage from '../page-objects/pages/login-page';
import ConnectAccountConfirmation from '../page-objects/pages/confirmations/redesign/connect-account-confirmation';

describe('eth_requestAccounts', function () {
  it('returns permitted accounts when there are permitted accounts and the wallet is unlocked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // eth_requestAccounts
        await driver.openNewPage(`http://127.0.0.1:8080`);

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
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // eth_requestAccounts
        await driver.openNewPage(`http://127.0.0.1:8080`);

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

  it.only('prompts for login when there are no permitted accounts and the wallet is locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // eth_requestAccounts
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const requestAccountRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_requestAccounts',
        });

        const requestAccount: Promise<string[]> = driver.executeScript(
          `return window.ethereum.request(${requestAccountRequest})`,
        );

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const loginPage = new LoginPage(this.driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          this.driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        assert.deepStrictEqual(await requestAccount, [
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        ]);
      },
    );
  });
});
