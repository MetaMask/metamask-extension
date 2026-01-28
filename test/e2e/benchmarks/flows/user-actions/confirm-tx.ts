/**
 * Benchmark: Confirm Transaction
 * Measures time to confirm a transaction
 */

import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { createInternalTransaction } from '../../../page-objects/flows/transaction';
import { Driver } from '../../../webdriver/driver';
import type { BenchmarkRunResult } from '../../utils/types';

export const testTitle = 'benchmark-userActions-confirmTx';
export const persona = 'standard';

export async function run(): Promise<BenchmarkRunResult> {
  let loadingTimes: number = 0;

  try {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        disableServerMochaToBackground: true,
        title: testTitle,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await createInternalTransaction({
          driver,
          recipientAddress: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          amount: '1',
        });

        const timestampBeforeAction = new Date();

        await driver.waitForSelector({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-status-label--confirmed',
          );
          return confirmedTxes.length === 1;
        }, 10000);
        await driver.waitForSelector('.transaction-status-label--confirmed');
        const timestampAfterAction = new Date();
        loadingTimes =
          timestampAfterAction.getTime() - timestampBeforeAction.getTime();
      },
    );

    return {
      timers: [{ id: 'confirm_tx', duration: loadingTimes }],
      success: true,
    };
  } catch (error) {
    return {
      timers: [{ id: 'confirm_tx', duration: loadingTimes }],
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
