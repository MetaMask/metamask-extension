const { strict: assert } = require('assert');
const { errorCodes } = require('@metamask/rpc-errors');
const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('MetaMask', function () {
  it('should reject unsupported methods', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
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
