import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../../constants';
import { withSpeculosFixtures } from '../../../speculos/with-speculos-fixtures';
import type { DeviceInteraction } from '../../../speculos/device-interaction';
import type { ApduBridge } from '../../../speculos/apdu-bridge';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { login } from '../../../page-objects/flows/login.flow';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';

async function approveLedgerSigning(
  interaction: DeviceInteraction,
  apduBridge: ApduBridge,
) {
  await apduBridge.waitForSigningApduAndApproveSigning(interaction, 90000);
}

describe('Ledger Hardware Signatures @speculos', function () {
  this.timeout(180000);

  // TODO: Speculos ethereum.elf v1.21.3 does not support EIP-712 signEIP712Message (INS=0x1a).
  // Re-enable when a compatible firmware image is available.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('sign typed v4', async function () {
    await withSpeculosFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });

        const ledgerDone = approveLedgerSigning(
          interaction,
          apduBridge,
        );

        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await testDappPage.clickSignTypedDatav4();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;
      },
    );
  });
});
