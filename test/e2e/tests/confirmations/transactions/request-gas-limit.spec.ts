/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { Driver } from '../../../webdriver/driver';

const { strict: assert } = require('assert');
const FixtureBuilder = require('../../../fixture-builder');
const { withFixtures, WINDOW_TITLES } = require('../../../helpers');

describe('dApp Request Gas Limit', function () {
  it('should update the gas limit in the activity list after submitting a request with custom gas (lower than 21000)', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            options: {
              hardfork: 'london',
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const hardCodedGasLimit = '20502';

        await createDappTransaction(driver, {
          maxPriorityFeePerGas: `0x${BigInt(10 ** 9).toString(16)}`,
          maxFeePerGas: `0x${BigInt(10 ** 10).toString(16)}`,
          gas: `0x${BigInt(hardCodedGasLimit).toString(16)}`,
        });

        // confirms the transaction
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Switch to the main MetaMask window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Click on Activity tab
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        // Wait for the transaction to appear and click on it
        const activityList = new ActivityListPage(driver);
        await activityList.checkFailedTxNumberDisplayedInActivity(1);
        await activityList.clickTransactionListItem();

        // Now on transaction details page, find and verify the gas limit
        const rows = await driver.findElements(
          '[data-testid="transaction-breakdown-row"]',
        );

        const gasLimit = await rows[2].getText();
        assert.equal(
          gasLimit,
          `Gas Limit (Units)\n${hardCodedGasLimit}`,
          'Gas limit in transaction details should match the requested value',
        );
      },
    );
  });

  it('should update the gas limit in the activity list after submitting a request with custom gas limit (lower than 21000)', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            options: {
              hardfork: 'london',
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const hardCodedGasLimit = '20502';

        await createDappTransaction(driver, {
          maxPriorityFeePerGas: `0x${BigInt(10 ** 9).toString(16)}`,
          maxFeePerGas: `0x${BigInt(10 ** 10).toString(16)}`,
          gasLimit: `0x${BigInt(hardCodedGasLimit).toString(16)}`,
        });

        // confirms the transaction
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Switch to the main MetaMask window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Click on Activity tab
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        // Wait for the transaction to appear and click on it
        const activityList = new ActivityListPage(driver);
        await activityList.checkFailedTxNumberDisplayedInActivity(1);
        await activityList.clickTransactionListItem();

        // Now on transaction details page, find and verify the gas limit
        const rows = await driver.findElements(
          '[data-testid="transaction-breakdown-row"]',
        );

        const gasLimit = await rows[2].getText();
        assert.equal(
          gasLimit,
          `Gas Limit (Units)\n${hardCodedGasLimit}`,
          'Gas limit in transaction details should match the requested value',
        );
      },
    );
  });

  it('should update the gas limit in the activity list after submitting a request with custom gas (above estimated gas limit)', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            options: {
              hardfork: 'london',
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const hardCodedGasLimit = '42000';

        await createDappTransaction(driver, {
          maxPriorityFeePerGas: `0x${BigInt(10 ** 9).toString(16)}`,
          maxFeePerGas: `0x${BigInt(10 ** 10).toString(16)}`,
          gas: `0x${BigInt(hardCodedGasLimit).toString(16)}`,
        });

        // confirms the transaction
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Switch to the main MetaMask window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Click on Activity tab
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        // Wait for the transaction to appear and click on it
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.clickTransactionListItem();

        // Now on transaction details page, find and verify the gas limit
        const rows = await driver.findElements(
          '[data-testid="transaction-breakdown-row"]',
        );

        const gasLimit = await rows[2].getText();
        assert.equal(
          gasLimit,
          `Gas Limit (Units)\n${hardCodedGasLimit}`,
          'Gas limit in transaction details should match the requested value',
        );
      },
    );
  });

  it('should update the gas limit in the activity list after submitting a request with custom gas limit (above estimated gas limit)', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            options: {
              hardfork: 'london',
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const hardCodedGasLimit = '42000';

        await createDappTransaction(driver, {
          maxPriorityFeePerGas: `0x${BigInt(10 ** 9).toString(16)}`,
          maxFeePerGas: `0x${BigInt(10 ** 10).toString(16)}`,
          gasLimit: `0x${BigInt(hardCodedGasLimit).toString(16)}`,
        });

        // confirms the transaction
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Switch to the main MetaMask window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Click on Activity tab
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        // Wait for the transaction to appear and click on it
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.clickTransactionListItem();

        // Now on transaction details page, find and verify the gas limit
        const rows = await driver.findElements(
          '[data-testid="transaction-breakdown-row"]',
        );

        const gasLimit = await rows[2].getText();
        assert.equal(
          gasLimit,
          `Gas Limit (Units)\n${hardCodedGasLimit}`,
          'Gas limit in transaction details should match the requested value',
        );
      },
    );
  });
});
