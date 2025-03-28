import { strict as assert } from 'assert';
import { errorCodes } from '@metamask/rpc-errors';
import { Suite } from 'mocha';
import { withFixtures, openDapp } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('MetaMask', function (this: Suite) {
  it('should reject unsupported methods', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

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
