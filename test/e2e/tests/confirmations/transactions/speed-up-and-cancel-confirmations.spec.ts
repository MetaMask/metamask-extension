/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { Hex } from '@metamask/utils';
import { decimalToPrefixedHex } from '../../../../../shared/modules/conversion.utils';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import {
  defaultGanacheOptionsForType2Transactions,
  unlockWallet,
} from '../../../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import { TransactionListPage } from '../../../page-objects/pages/transaction-list-page';
import { TransactionDetailsPage } from '../../../page-objects/pages/transaction-details-page';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
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
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract: SMART_CONTRACTS.PIGGYBANK,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: TestSuiteArguments) => {
          await unlockWallet(driver);

          // Create initial stuck transaction
          await createDappTransaction(driver, {
            value: ethInHexWei(0.1),
            maxFeePerGas: decimalToPrefixedHex(0),
            maxPriorityFeePerGas: decimalToPrefixedHex(0),
            to: DEFAULT_FIXTURE_ACCOUNT,
          });

          // Wait for confirmation dialog and confirm initial transaction
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const confirmationPage = new Confirmation(driver);
          await confirmationPage.clickFooterConfirmButton();

          // Switch to extension and handle transaction
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const transactionListPage = new TransactionListPage(driver);
          await transactionListPage.goToActivityTab();
          await transactionListPage.waitForPendingTransaction();
          await transactionListPage.clickPendingTransaction();

          const transactionDetailsPage = new TransactionDetailsPage(driver);
          await transactionDetailsPage.speedUpTransaction();

          await transactionListPage.waitForTransactionStatus('confirmed');
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
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract: SMART_CONTRACTS.PIGGYBANK,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: TestSuiteArguments) => {
          await unlockWallet(driver);

          // Create initial stuck transaction
          await createDappTransaction(driver, {
            value: ethInHexWei(0.1),
            maxFeePerGas: decimalToPrefixedHex(0),
            maxPriorityFeePerGas: decimalToPrefixedHex(0),
            to: DEFAULT_FIXTURE_ACCOUNT,
          });

          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const confirmationPage = new Confirmation(driver);
          await confirmationPage.clickFooterConfirmButton();

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const transactionListPage = new TransactionListPage(driver);
          await transactionListPage.goToActivityTab();
          await transactionListPage.waitForPendingTransaction();
          await transactionListPage.cancelTransaction();
          await transactionListPage.waitForTransactionStatus('cancelled');
        },
      );
    });
  });
});
