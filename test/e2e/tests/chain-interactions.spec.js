const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Chain Interactions', function () {
  const port = 8546;
  const chainId = 1338;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
    concurrent: { port, chainId },
  };
  it('should add the Ganache test chain and not switch the network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // trigger add chain confirmation
        await openDapp(driver);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // verify chain details
        const [networkName, networkUrl, chainIdElement] =
          await driver.findElements('.definition-list dd');
        assert.equal(await networkName.getText(), `Localhost ${port}`);
        assert.equal(await networkUrl.getText(), `http://127.0.0.1:${port}`);
        assert.equal(await chainIdElement.getText(), chainId.toString());

        // approve add chain, cancel switch chain
        await driver.clickElement({ text: 'Approve', tag: 'button' });
        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        // switch to extension
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindow(extension);

        // verify networks
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8545',
        });

        await driver.clickElement('[data-testid="network-display"]');
        const ganacheChain = await driver.findElements({
          text: `Localhost ${port}`,
          tag: 'p',
        });
        assert.ok(ganacheChain.length, 1);
      },
    );
  });

  it('should add the Ganache chain and switch the network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // trigger add chain confirmation
        await openDapp(driver);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // approve and switch chain
        await driver.clickElement({ text: 'Approve', tag: 'button' });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        // switch to extension
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // verify current network
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: `Localhost ${port}`,
        });
      },
    );
  });
});
