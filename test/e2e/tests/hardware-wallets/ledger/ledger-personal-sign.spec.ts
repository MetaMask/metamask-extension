import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withSpeculosFixtures } from '../../../speculos/with-speculos-fixtures';
import { WINDOW_TITLES } from '../../../constants';
import { login } from '../../../page-objects/flows/login.flow';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import { SPECULOS_LEDGER_ADDRESS, approveSigning } from './ledger-helpers';

describe('Ledger Hardware Signatures @speculos', function (this: Suite) {
  this.timeout(180000);

  it('personal sign', async function () {
    await withSpeculosFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withSpeculosLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });

        const ledgerDone = approveSigning(interaction, apduBridge);

        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await testDappPage.personalSign();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkSuccessPersonalSign(SPECULOS_LEDGER_ADDRESS);
      },
    );
  });
});
