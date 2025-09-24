import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Anvil } from '../../../seeder/anvil';
import { Driver } from '../../../webdriver/driver';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import Eip7702AndSendCalls from '../../../page-objects/pages/confirmations/redesign/batch-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { mockEip7702FeatureFlag } from '../helpers';

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
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginWithBalanceValidation(driver);

        // We check that we have an EOA account
        let accountBytecode = await localNodes[0].getCode(
          DEFAULT_FIXTURE_ACCOUNT,
        );
        assert.strictEqual(accountBytecode, undefined);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(driver);

        // acknowledge splash page
        await upgradeAndBatchTxConfirmation.clickUseSmartAccountButton();

        await upgradeAndBatchTxConfirmation.checkExpectedTxTypeIsDisplayed(
          'Smart account',
        );
        await upgradeAndBatchTxConfirmation.checkExpectedInteractingWithIsDisplayed(
          'Account 1',
        );

        // Open Settings and very tx details
        await upgradeAndBatchTxConfirmation.clickAdvancedDetailsButton();
        await upgradeAndBatchTxConfirmation.checkBatchTxListIsPresent();

        // Confirm upgrade and batch tx
        await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check the batch transaction has been successfully performed
        // which included x2 simple sends of 0.001ETH, so the ETH balance should also be updated
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await homePage.checkExpectedBalanceIsDisplayed('24.9998', 'ETH');

        // We check that we have an upgraded account
        accountBytecode = await localNodes[0].getCode(DEFAULT_FIXTURE_ACCOUNT);
        assert.strictEqual(
          accountBytecode,
          '0xef01008438ad1c834623cff278ab6829a248e37c2d7e3f',
        );
      },
    );
  });

  it('an EOA account is not upgraded when rejecting a batch transaction, but can trigger a new send call', async function () {
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
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginWithBalanceValidation(driver);

        // We check that we have an EOA account
        let accountBytecode = await localNodes[0].getCode(
          DEFAULT_FIXTURE_ACCOUNT,
        );
        assert.strictEqual(accountBytecode, undefined);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(driver);

        // Reject batch tx
        await upgradeAndBatchTxConfirmation.clickUseSmartAccountButton();
        await upgradeAndBatchTxConfirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        // We check that we continue to have an EOA account
        accountBytecode = await localNodes[0].getCode(DEFAULT_FIXTURE_ACCOUNT);
        assert.strictEqual(accountBytecode, undefined);

        // We check that we can trigger a new send call, as upgrade tx was not rejected
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await upgradeAndBatchTxConfirmation.checkExpectedTxTypeIsDisplayed(
          'Smart account',
        );
        await upgradeAndBatchTxConfirmation.checkExpectedInteractingWithIsDisplayed(
          'Account 1',
        );
      },
    );
  });
});
