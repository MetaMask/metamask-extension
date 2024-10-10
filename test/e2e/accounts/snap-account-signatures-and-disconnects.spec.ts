import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import {
  withFixtures,
  multipleGanacheOptions,
  tempToggleSettingRedesignedConfirmations,
} from '../helpers';
import { Driver } from '../webdriver/driver';
import { Ganache } from '../seeder/ganache';
import { installSnapSimpleKeyring } from '../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import {
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
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        const flowType = 'approve';

        await loginWithBalanceValidation(driver, ganacheServer);
        await installSnapSimpleKeyring(driver, false);

        const newPublicKey = await makeNewAccountAndSwitch(driver);

        await tempToggleSettingRedesignedConfirmations(driver);

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
