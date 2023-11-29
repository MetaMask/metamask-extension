const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const createStaticServer = require('../../../development/create-static-server');

const dappPort = 8080;

describe('The provider', function () {
  it('can be injected synchronously and successfully used by a dapp', async function () {
    const dappServer = createStaticServer(__dirname);
    dappServer.listen(dappPort);
    await new Promise((resolve, reject) => {
      dappServer.on('listening', resolve);
      dappServer.on('error', reject);
    });

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage(`http://127.0.0.1:8080`);

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

    await new Promise((resolve, reject) => {
      dappServer.close((error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  });
});
