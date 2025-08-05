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

// Function is needed to increase the gas limit for upgrade account confirmation
// There is apparently an issue with Anvil network that prevents correct estimation of gas limit for upgrade.
const increaseGasLimit = async (driver: Driver) => {
  await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
  await driver.clickElement('[data-testid="edit-gas-fee-item-custom"]');

  await driver.clickElement('[data-testid="advanced-gas-fee-edit"]');
  await driver.fill('[data-testid="gas-limit-input"]', '50000');

  // Submit gas fee changes
  await driver.clickElement({ text: 'Save', tag: 'button' });
  await driver.clickElement({ text: 'Advanced' });
};

describe('Switch Modal - Switch Account', function (this: Suite) {
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
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.triggerAccountSwitch();

        const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(driver);
        await upgradeAndBatchTxConfirmation.check_expectedTxTypeIsDisplayed(
          "You're switching to a smart account",
        );
        await upgradeAndBatchTxConfirmation.check_expectedInteractingWithIsDisplayed(
          'Account 1',
        );
        await increaseGasLimit(driver);
        await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        let activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(1);

        // Downgrade Account
        await headerNavbar.openAccountDetailsModal();
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.triggerAccountSwitch();

        await upgradeAndBatchTxConfirmation.check_expectedTxTypeIsDisplayed(
          "You're switching back to a standard account (EOA).",
        );
        await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(2);
      },
    );
  });
});
