import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../../constants';
import { withSpeculosFixtures } from '../../../speculos/with-speculos-fixtures';
import { login } from '../../../page-objects/flows/login.flow';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import HardwareWalletConfirmation from '../../../page-objects/pages/hardware-wallet/hardware-wallet-confirmation';
import { SPECULOS_LEDGER_ADDRESS, approveSigning } from './ledger-helpers';

describe('Ledger Hardware Signatures @speculos', function () {
  this.timeout(180000);

  it('sign typed v4', async function () {
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
        await testDappPage.clickSignTypedDatav4();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new HardwareWalletConfirmation(driver);
        await confirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;
      },
    );
  });
});
