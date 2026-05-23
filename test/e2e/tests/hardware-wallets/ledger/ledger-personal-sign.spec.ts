import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosAutoApprove,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { WINDOW_TITLES } from '../../../constants';
import { login } from '../../../page-objects/flows/login.flow';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';

describe('Ledger Hardware Signatures @speculos', function (this: Suite) {
  this.timeout(120000);

  let shared: SharedSpeculosContext;

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  it('personal sign', async function () {
    await withSpeculosAutoApprove(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await testDappPage.personalSign();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkSuccessPersonalSign(SPECULOS_LEDGER_ADDRESS);
      },
    );
  });
});
