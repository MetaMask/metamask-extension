const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

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
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // trigger add chain confirmation
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // verify chain details
        const [
          networkName,
          networkUrl,
          chainIdElement,
        ] = await driver.findElements('.definition-list dd');
        assert.equal(await networkName.getText(), `Localhost ${port}`);
        assert.equal(await networkUrl.getText(), `http://127.0.0.1:${port}`);
        assert.equal(await chainIdElement.getText(), chainId.toString());

        // approve add chain, cancel switch chain
        await driver.clickElement({ text: 'Approve', tag: 'button' });
        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        // switch to extension
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // verify networks
        const networkDisplay = await driver.findElement('.network-display');
        await networkDisplay.click();
        assert.equal(await networkDisplay.getText(), 'Localhost 8545');
        const ganacheChain = await driver.findElements({
          text: `Localhost ${port}`,
          tag: 'span',
        });
        assert.ok(ganacheChain.length, 1);
      },
    );
  });

  it('should add the Ganache chain and switch the network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // trigger add chain confirmation
        await driver.openNewPage('http://127.0.0.1:8080/');
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
        const networkDisplay = await driver.findElement('.network-display');
        assert.equal(await networkDisplay.getText(), `Localhost ${port}`);
      },
    );
  });
});
