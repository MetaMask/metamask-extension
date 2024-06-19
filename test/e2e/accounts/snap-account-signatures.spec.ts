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
      await withFixtures(
        accountSnapFixtures(title),
        async ({ driver }: { driver: Driver }) => {
          const isAsyncFlow = flowType !== 'sync';

          await installSnapSimpleKeyring(driver, isAsyncFlow);

          const newPublicKey = await makeNewAccountAndSwitch(driver);

          await openDapp(driver);

          const locatorIDs = [
            '#ethSign',
            '#personalSign',
            '#signTypedData',
            '#signTypedDataV3',
            '#signTypedDataV4',
            '#signPermit',
          ];

          for (const locatorID of locatorIDs) {
            await signData(driver, locatorID, newPublicKey, flowType);
          }
        },
      );
    });
  });
});
