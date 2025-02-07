import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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
      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        const isExtensionLoaded: boolean = await driver.executeScript(
          'return typeof window.ethereum !== "undefined"',
        );
        assert.equal(isExtensionLoaded, true);
      },
    );
  });
});
