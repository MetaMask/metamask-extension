import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Content-Security-Policy', function (this: Suite) {
  // TODO: Re-enable this after fixing the CSP override feature. See #31094
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('opening a restricted website should still load the extension', async function () {
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
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
