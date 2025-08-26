import { strict as assert } from 'assert';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import Confirmation from '../page-objects/pages/confirmations/redesign/confirmation';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import LoginPage from '../page-objects/pages/login-page';

describe('eth_sendTransaction', function () {
  const expectedHash =
    '0x855951a65dcf5949dc54beb032adfb604c52a0a548a0f616799d6873a9521470';

  it('confirms a new transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // eth_sendTransaction
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [
            {
              to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              value: '0x0',
              maxPriorityFeePerGas: '0x3b9aca00',
              maxFeePerGas: '0x2540be400',
            },
          ],
          id: 0,
        });
        await driver.executeScript(
          `window.transactionHash = window.ethereum.request(${request})`,
        );

        // confirm transaction in mm popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        const actualHash = await driver.executeScript(
          `return window.transactionHash;`,
        );
        assert.equal(actualHash, expectedHash);
      },
    );
  });

  it('rejects a new transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // eth_sendTransaction
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [
            {
              to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              value: '0x0',
              maxPriorityFeePerGas: '0x3b9aca00',
              maxFeePerGas: '0x2540be400',
            },
          ],
          id: 0,
        });
        await driver.executeScript(
          `window.transactionHash = window.ethereum.request(${request})`,
        );

        // reject transaction in mm popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        const result = await driver
          .executeScript(`return window.transactionHash;`)
          .then((data: unknown) => {
            return data;
          })
          .catch((err: Error) => {
            return err;
          });
        assert.ok(
          result.message.includes(
            'MetaMask Tx Signature: User denied transaction signature.',
          ),
        );
      },
    );
  });

  it('prompts for unlock when the wallet is locked and the requesting origin has permission for the account specified in the "from" parameter', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // eth_sendTransaction
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [
            {
              to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              value: '0x0',
              maxPriorityFeePerGas: '0x3b9aca00',
              maxFeePerGas: '0x2540be400',
            },
          ],
          id: 0,
        });
        await driver.executeScript(
          `window.transactionHash = window.ethereum.request(${request})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        const confirmation = new Confirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        const actualHash = await driver.executeScript(
          `return window.transactionHash;`,
        );
        assert.equal(actualHash, expectedHash);
      },
    );
  });
});
