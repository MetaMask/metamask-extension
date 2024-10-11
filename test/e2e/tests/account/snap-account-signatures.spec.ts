import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { accountSnapFixtures } from '../../accounts/common';
import { SnapAccountPage } from '../../page-objects/snap-account-page';

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
          const snapAccountPage = new SnapAccountPage(driver);
          const isAsyncFlow = flowType !== 'sync';

          await snapAccountPage.installSnapSimpleKeyring(isAsyncFlow);

          const newPublicKey = await snapAccountPage.makeNewAccountAndSwitch();

          await snapAccountPage.tempToggleSettingRedesignedConfirmations();

          // Run all 5 signature types
          const locatorIDs = [
            '#personalSign',
            '#signTypedData',
            '#signTypedDataV3',
            '#signTypedDataV4',
            '#signPermit',
          ];

          for (const locatorID of locatorIDs) {
            await snapAccountPage.signData(locatorID, newPublicKey, flowType);
          }
        },
      );
    });
  });
});
