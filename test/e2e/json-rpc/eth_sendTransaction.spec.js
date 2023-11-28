const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_sendTransaction', function () {
  const ganacheOptions = {
    hardfork: 'london',
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  const expectedHash =
    '0x855951a65dcf5949dc54beb032adfb604c52a0a548a0f616799d6873a9521470';
  it('confirms a new transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // eth_sendTransaction
        await driver.openNewPage(`http://127.0.0.1:8080`);
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
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle('MetaMask Notification');
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.switchToWindowWithTitle('E2E Test Dapp');
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
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // eth_sendTransaction
        await driver.openNewPage(`http://127.0.0.1:8080`);
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
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle('MetaMask Notification');
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.switchToWindowWithTitle('E2E Test Dapp');
        const result = await driver
          .executeScript(`return window.transactionHash;`)
          .then((data) => {
            return data;
          })
          .catch((err) => {
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
});
