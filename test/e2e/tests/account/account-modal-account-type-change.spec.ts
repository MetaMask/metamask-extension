import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Anvil } from '@viem/anvil';
import { Driver } from '../../webdriver/driver';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import Eip7702AndSendCalls from '../../page-objects/pages/confirmations/redesign/batch-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import { mockEip7702FeatureFlag } from '../confirmations/helpers';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountDetailsModal from '../../page-objects/pages/dialog/account-details-modal';

describe('Upgrade Account', function (this: Suite) {
  it('an EOA account can be upgraded when triggering a batch tx from a dapp in an odd chain id', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
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
      async ({ driver, localNodes }: { driver: Driver; localNodes: Anvil }) => {
        await loginWithBalanceValidation(driver);

        // We check that we have an EOA account
        let accountBytecode = await localNodes[0].getCode(
          DEFAULT_FIXTURE_ACCOUNT,
        );
        assert.strictEqual(accountBytecode, undefined);

        await new HeaderNavbar(driver).openAccountDetailsModal();
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.triggerAccountSwitch();

        const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(driver);

        await upgradeAndBatchTxConfirmation.check_expectedTxTypeIsDisplayed(
          'Smart account',
        );
        await upgradeAndBatchTxConfirmation.check_expectedInteractingWithIsDisplayed(
          'Account 1',
        );

        // Confirm upgrade
        await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check the batch transaction has been successfully performed
        // which included x2 simple sends of 0.001ETH, so the ETH balance should also be updated
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await driver.delay(50000);

        await activityList.check_confirmedTxNumberDisplayedInActivity(1);
        await homePage.check_expectedBalanceIsDisplayed('24.9998', 'ETH');

        // We check that we have an upgraded account
        accountBytecode = await localNodes[0].getCode(DEFAULT_FIXTURE_ACCOUNT);
        assert.strictEqual(
          accountBytecode,
          '0xef01008438ad1c834623cff278ab6829a248e37c2d7e3f',
        );
      },
    );
  });
});
