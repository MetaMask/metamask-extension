/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { Hex } from '@metamask/utils';
import { decimalToPrefixedHex } from '../../../../../shared/modules/conversion.utils';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import {
  defaultGanacheOptionsForType2Transactions,
  unlockWallet,
} from '../../../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
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
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          // Switch to extension and go to activity tab
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );

          // Wait for transaction to be pending
          await driver.waitForSelector('.transaction-status-label--pending');

          // Click on the pending transaction
          await driver.clickElement('.transaction-list-item');

          // Click speed up button and confirm
          await driver.clickElement('[data-testid="speedup-button"]');
          await driver.clickElement({ text: 'Submit', tag: 'button' });

          // Verify the sped-up transaction is confirmed
          await driver.waitForSelector('.transaction-status-label--confirmed', {
            timeout: 5 * 1000,
          });
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

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );

          // Wait for and pending transaction
          await driver.waitForSelector('.transaction-status-label--pending');

          // Cancel the transaction
          await driver.clickElement({ text: 'Cancel', tag: 'button' });
          await driver.clickElement({ text: 'Submit', tag: 'button' });

          // Verify transaction is cancelled
          await driver.waitForSelector('.transaction-status-label--cancelled', {
            timeout: 5 * 1000,
          });
        },
      );
    });
  });
});
