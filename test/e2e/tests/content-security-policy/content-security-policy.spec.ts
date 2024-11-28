import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';

describe('Content-Security-Policy', function (this: Suite) {
  it('opening a restricted website should still load the extension', async function () {
    await withFixtures(
      {
        dapp: true,
        dappPaths: [
          './tests/content-security-policy/content-security-policy-mock-page',
        ],
        staticServerOptions: {
          headers: [
            {
              source: 'index.html',
              headers: [
                {
                  key: 'Content-Security-Policy',
                  value: `default-src 'none'`,
                },
              ],
            },
          ],
        },
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        const isExtensionLoaded: boolean = await driver.executeScript(
          'return typeof window.ethereum !== "undefined"',
        );
        assert.equal(isExtensionLoaded, true);
      },
    );
  });
});
