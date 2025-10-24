import { Suite } from 'mocha';
import { Anvil } from '@viem/anvil';

import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AccountDetailsModal from '../../page-objects/pages/dialog/account-details-modal';
import Eip7702AndSendCalls from '../../page-objects/pages/confirmations/redesign/batch-confirmation';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockEip7702FeatureFlag } from '../confirmations/helpers';

// Switch Account is not available in BIP44 stage 2
// eslint-disable-next-line
describe.skip('Switch Modal - Switch Account', function (this: Suite) {
  it('Account modal should have options to upgrade / downgrade the account', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              hardfork: 'prague',
              loadState:
                './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await loginWithBalanceValidation(driver);

        // Upgrade Account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountDetailsModal();
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.checkPageIsLoaded();
        await accountDetailsModal.triggerAccountSwitch();

        const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(driver);
        await upgradeAndBatchTxConfirmation.checkExpectedTxTypeIsDisplayed(
          "You're switching to a smart account",
        );
        await upgradeAndBatchTxConfirmation.checkExpectedInteractingWithIsDisplayed(
          'Account 1',
        );

        // There is apparently an issue with Anvil network that prevents correct estimation of gas limit for upgrade.
        await upgradeAndBatchTxConfirmation.editGasLimitLondon('50000');
        await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        let activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

        // Downgrade Account
        await headerNavbar.openAccountDetailsModal();
        await accountDetailsModal.checkPageIsLoaded();
        await accountDetailsModal.triggerAccountSwitch();

        await upgradeAndBatchTxConfirmation.checkExpectedTxTypeIsDisplayed(
          "You're switching back to a standard account (EOA).",
        );
        await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(2);
      },
    );
  });
});
