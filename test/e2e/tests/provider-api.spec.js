const { strict: assert } = require('assert');
const { errorCodes } = require('eth-rpc-errors');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('MetaMask', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('provider should inform dapp when switching networks', async function () {
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

        await driver.openNewPage('http://127.0.0.1:8080/');
        const networkDiv = await driver.waitForSelector({
          css: '#network',
          text: '1337',
        });
        const chainIdDiv = await driver.waitForSelector({
          css: '#chainId',
          text: '0x539',
        });
        assert.equal(await networkDiv.getText(), '1337');
        assert.equal(await chainIdDiv.getText(), '0x539');

        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindow(windowHandles[0]);

        await driver.clickElement('.network-display');
        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'span' });

        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        const switchedNetworkDiv = await driver.waitForSelector({
          css: '#network',
          text: '0x1',
        });
        const switchedChainIdDiv = await driver.waitForSelector({
          css: '#chainId',
          text: '0x1',
        });
        const accountsDiv = await driver.findElement('#accounts');

        assert.equal(await switchedNetworkDiv.getText(), '0x1');
        assert.equal(await switchedChainIdDiv.getText(), '0x1');
        assert.equal(
          await accountsDiv.getText(),
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
      },
    );
  });

  it('should reject unsupported methods', async function () {
    await withFixtures(
      {
        dapp: true,
        failOnConsoleError: false,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        for (const unsupportedMethod of ['eth_signTransaction']) {
          assert.equal(
            await driver.executeAsyncScript(`
              const webDriverCallback = arguments[arguments.length - 1];
              window.ethereum.request({ method: '${unsupportedMethod}' })
                .then(() => {
                  console.error('The unsupported method "${unsupportedMethod}" was not rejected.');
                  webDriverCallback(false);
                })
                .catch((error) => {
                  if (error.code === ${errorCodes.rpc.methodNotSupported}) {
                    webDriverCallback(true);
                  }

                  console.error(
                    'The unsupported method "${unsupportedMethod}" was rejected with an unexpected error.',
                    error,
                  );
                  webDriverCallback(false);
                })
            `),
            true,
            `The unsupported method "${unsupportedMethod}" should be rejected by the provider.`,
          );
        }
      },
    );
  });
});
