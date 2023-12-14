const { strict: assert } = require('assert');
const { errorCodes } = require('eth-rpc-errors');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

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
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
        await unlockWallet(driver);

        await openDapp(driver);
        const chainIdDiv = await driver.waitForSelector({
          css: '#chainId',
          text: '0x539',
        });
        assert.equal(await chainIdDiv.getText(), '0x539');

        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindow(windowHandles[0]);

        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        const switchedChainIdDiv = await driver.waitForSelector({
          css: '#chainId',
          text: '0x1',
        });
        const accountsDiv = await driver.findElement('#accounts');

        assert.equal(await switchedChainIdDiv.getText(), '0x1');
        assert.equal(await accountsDiv.getText(), publicAddress);
      },
    );
  });

  it('should reject unsupported methods', async function () {
    await withFixtures(
      {
        dapp: true,
        failOnConsoleError: false,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
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
