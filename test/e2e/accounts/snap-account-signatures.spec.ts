import { Suite } from 'mocha';
import { openDapp, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import {
  accountSnapFixtures,
  installSnapSimpleKeyring,
  makeNewAccountAndSwitch,
  signData,
} from './common';

describe('Snap Account Signatures', function (this: Suite) {
  this.timeout(120000); // This test is very long, so we need an unusually high timeout

  ['sync', 'approve', 'reject'].forEach((flowType) => {
    const title = `can sign with ${flowType} flow`;

    it(title, async function () {
      this.retries(3); // Retry failed tests up to 3 times

      await withFixtures(
        accountSnapFixtures(title),
        async ({ driver }: { driver: Driver }) => {
          const isAsyncFlow = flowType !== 'sync';

          console.log(`Starting test for ${flowType} flow`);

          await installSnapSimpleKeyring(driver, isAsyncFlow);
          console.log(`Installed SnapSimpleKeyring for ${flowType} flow`);

          const newPublicKey = await makeNewAccountAndSwitch(driver);
          console.log(
            `Switched to new account with public key: ${newPublicKey}`,
          );

          await openDapp(driver);
          console.log(`Opened Dapp`);

          const locatorIDs = [
            '#ethSign',
            '#personalSign',
            '#signTypedData',
            '#signTypedDataV3',
            '#signTypedDataV4',
            '#signPermit',
          ];

          for (const locatorID of locatorIDs) {
            console.log(
              `Attempting to sign data with locator ID: ${locatorID}`,
            );
            await signData(driver, locatorID, newPublicKey, flowType);
            console.log(
              `Successfully signed data with locator ID: ${locatorID}`,
            );
          }

          console.log(`Completed test for ${flowType} flow`);
        },
      );
    });
  });
});
