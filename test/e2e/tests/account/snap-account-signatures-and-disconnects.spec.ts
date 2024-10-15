import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import {
  withFixtures,
  multipleGanacheOptions,
  tempToggleSettingRedesignedConfirmations,
  WINDOW_TITLES,
} from '../helpers';
import { Driver } from '../webdriver/driver';
import { TestDapp } from '../page-objects/test-dapp';
import { SnapAccountPage } from '../page-objects/snap-account-page';
import { SignatureRequestPage } from '../page-objects/signature-request-page';

describe('Snap Account Signatures and Disconnects', function (this: Suite) {
  it('can connect to the Test Dapp, then #signTypedDataV3, disconnect then connect, then #signTypedDataV4 (async flow approve)', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: multipleGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const testDapp = new TestDapp(driver);
        const snapAccountPage = new SnapAccountPage(driver);
        const signatureRequestPage = new SignatureRequestPage(driver);

        const isAsyncFlow = true;

        await snapAccountPage.installSnapSimpleKeyring(isAsyncFlow);

        const newPublicKey = await snapAccountPage.makeNewAccountAndSwitch();

        await tempToggleSettingRedesignedConfirmations(driver);

        // open the Test Dapp and connect Account 2 to it
        await testDapp.connect();

        // do #signTypedDataV3
        await testDapp.signTypedDataV3();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
        await signatureRequestPage.approveSignatureRequest();

        // disconnect from the Test Dapp
        await testDapp.disconnect();

        // reconnect Account 2 to the Test Dapp
        await testDapp.connect();

        // do #signTypedDataV4
        await testDapp.signTypedDataV4();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
        await signatureRequestPage.approveSignatureRequest();
      },
    );
  });
});
