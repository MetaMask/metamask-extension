/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { Hex } from '@metamask/utils';
import { decimalToPrefixedHex } from '../../../../../shared/modules/conversion.utils';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import {
  defaultGanacheOptionsForType2Transactions,
  unlockWallet,
} from '../../../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import { TestSuiteArguments } from './shared';

const { WINDOW_TITLES, withFixtures } = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');

const ethInHexWei = (eth: number): Hex => decimalToPrefixedHex(eth * 10 ** 18);

describe('Speed Up and Cancel Transaction Tests', function () {
  describe('Speed up transaction', function () {
    it('Successfully speeds up a pending transaction', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          localNodeOptions: defaultGanacheOptionsForType2Transactions,
          title: this.test?.fullTitle(),
        },
        async ({ driver, localNodes }: TestSuiteArguments) => {
          await unlockWallet(driver);

          // Create initial stuck transaction
          await createDappTransaction(driver, {
            value: ethInHexWei(0.1),
            maxFeePerGas: decimalToPrefixedHex(0),
            maxPriorityFeePerGas: decimalToPrefixedHex(0),
            to: DEFAULT_FIXTURE_ACCOUNT,
          });

          // Wait for confirmation dialog and confirm initial transaction
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const confirmationPage = new Confirmation(driver);
          await confirmationPage.clickFooterConfirmButton();

          // Switch to extension and handle transaction
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          (await localNodes?.[0]?.mineBlock()) ??
            console.error('localNodes is undefined or empty');

          const homePage = new HomePage(driver);
          await homePage.goToActivityList();

          const activityListPage = new ActivityListPage(driver);
          await activityListPage.check_completedTxNumberDisplayedInActivity(1);

          await activityListPage.click_transactionListItem();
          await activityListPage.click_speedUpTransaction();
          await activityListPage.click_confirmTransactionReplacement();
          (await localNodes?.[0]?.mineBlock()) ??
            console.error('localNodes is undefined or empty');

          await activityListPage.check_waitForTransactionStatus('confirmed');
        },
      );
    });
  });

  describe('Cancel transaction', function () {
    it('Successfully cancels a pending transaction', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          localNodeOptions: defaultGanacheOptionsForType2Transactions,
          title: this.test?.fullTitle(),
        },
        async ({ driver, localNodes }: TestSuiteArguments) => {
          await unlockWallet(driver);

          // Create initial stuck transaction
          await createDappTransaction(driver, {
            value: ethInHexWei(0.1),
            maxFeePerGas: decimalToPrefixedHex(0),
            maxPriorityFeePerGas: decimalToPrefixedHex(0),
            to: DEFAULT_FIXTURE_ACCOUNT,
          });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const confirmationPage = new Confirmation(driver);
          await confirmationPage.clickFooterConfirmButton();
          (await localNodes?.[0]?.mineBlock()) ??
            console.error('localNodes is undefined or empty');
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const homePage = new HomePage(driver);
          await homePage.goToActivityList();

          const activityListPage = new ActivityListPage(driver);
          await activityListPage.check_completedTxNumberDisplayedInActivity(1);

          await activityListPage.click_cancelTransaction();
          await activityListPage.click_confirmTransactionReplacement();
          (await localNodes?.[0]?.mineBlock()) ??
            console.error('localNodes is undefined or empty');
          await activityListPage.check_waitForTransactionStatus('cancelled');
        },
      );
    });
  });
});
