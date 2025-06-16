import { strict as assert } from 'assert';
import { withFixtures, openDapp } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import createStaticServer from '../../../../development/create-static-server';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const dappPort = 8080;

describe('The provider', function () {
  it('can be injected synchronously and successfully used by a dapp', async function () {
    const dappServer = createStaticServer({ public: __dirname });
    dappServer.listen(dappPort);
    await new Promise((resolve, reject) => {
      dappServer.on('listening', resolve);
      dappServer.on('error', reject);
    });

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await openDapp(driver);

        const isExpectedChainIdTextRendered =
          await driver.isElementPresentAndVisible({
            tag: 'div',
            text: 'Chain Id: 0x539',
          });
        assert.equal(
          isExpectedChainIdTextRendered,
          true,
          'ChainId not rendered, synchronous injection (or the metamask provider api) may not be working',
        );
      },
    );

    await new Promise<void>((resolve, reject) => {
      dappServer.close((error?: Error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  });
});
