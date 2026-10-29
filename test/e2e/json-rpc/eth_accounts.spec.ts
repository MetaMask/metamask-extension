import { strict as assert } from 'assert';
import { withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { ACCOUNT_1, ACCOUNT_2 } from '../constants';
import { login } from '../page-objects/flows/login.flow';

describe('eth_accounts', function () {
  it('returns permitted eth accounts when wallet is unlocked', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .withPermissionControllerConnectedToTestDapp({
            account: [ACCOUNT_1, ACCOUNT_2],
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // eth_accounts
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const accountsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_accounts',
        });

        const accounts: string[] = await driver.executeScript(
          `return window.ethereum.request(${accountsRequest})`,
        );

        assert.deepStrictEqual(accounts, [ACCOUNT_2, ACCOUNT_1]);
      },
    );
  });

  it('returns permitted eth accounts when wallet is locked', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .withPermissionControllerConnectedToTestDapp({
            account: [ACCOUNT_1, ACCOUNT_2],
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // eth_accounts
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const accountsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_accounts',
        });

        const accounts: string[] = await driver.executeScript(
          `return window.ethereum.request(${accountsRequest})`,
        );

        assert.deepStrictEqual(accounts, [ACCOUNT_2, ACCOUNT_1]);
      },
    );
  });
});
