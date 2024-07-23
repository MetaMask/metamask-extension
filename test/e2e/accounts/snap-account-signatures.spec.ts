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

  // Run sync, async approve, and async reject flows
  // (in Jest we could do this with test.each, but that does not exist here)
  ['sync', 'approve', 'reject'].forEach((flowType) => {
    // generate title of the test from flowType
    const title = `can sign with ${flowType} flow`;

    it(title, async () => {
      await withFixtures(
        accountSnapFixtures(title),
        async ({ driver }: { driver: Driver }) => {
          const isAsyncFlow = flowType !== 'sync';

          await installSnapSimpleKeyring(driver, isAsyncFlow);

          const newPublicKey = await makeNewAccountAndSwitch(driver);

          await openDapp(driver);

          // Run all 6 signature types
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
