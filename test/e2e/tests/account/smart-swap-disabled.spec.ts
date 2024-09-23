import { title } from 'process';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  accountSnapFixtures,
  makeNewAccountAndSwitch,
} from '../accounts/common';
import { installSnapSimpleKeyring } from '../accounts/common';
import { SmartSwapPage } from '../page-objects/SmartSwapPage';

describe('Smart Swaps', function (this: Suite) {
  it('should be disabled for snap accounts', async function () {
    await withFixtures(
      accountSnapFixtures(title),
      async ({ driver }: { driver: Driver }) => {
        const smartSwapPage = new SmartSwapPage(driver);

        await installSnapSimpleKeyring(driver, false);
        await makeNewAccountAndSwitch(driver);

        await smartSwapPage.clickTokenOverviewSwapButton();
        await smartSwapPage.clickTransactionSettingsButton();
        await smartSwapPage.checkSmartSwapsToggleNotPresent();
      },
    );
  });
});
