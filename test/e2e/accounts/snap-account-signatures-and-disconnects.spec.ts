import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, multipleGanacheOptions } from '../helpers';
import { Driver } from '../webdriver/driver';
import {
  installSnapSimpleKeyring,
  makeNewAccountAndSwitch,
  connectAccountToTestDapp,
  disconnectFromTestDapp,
  signData,
} from './common';

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
        const flowType = 'approve';
        const isAsyncFlow = true;

        await installSnapSimpleKeyring(driver, isAsyncFlow);

        const newPublicKey = await makeNewAccountAndSwitch(driver);

        // open the Test Dapp and connect Account 2 to it
        await connectAccountToTestDapp(driver);

        // do #signTypedDataV3
        await signData(driver, '#signTypedDataV3', newPublicKey, flowType);

        // disconnect from the Test Dapp
        await disconnectFromTestDapp(driver);

        // reconnect Account 2 to the Test Dapp
        await connectAccountToTestDapp(driver);

        // do #signTypedDataV4
        await signData(driver, '#signTypedDataV4', newPublicKey, flowType);
      },
    );
  });
});
