/**
 * Benchmark: Confirm Transaction
 * Measures time to confirm a transaction
 *
 * This flow stays harness-clocked. No app span covers the `confirm_tx` step,
 * so there is nothing to read from Sentry here (cf. extension#46680):
 *
 * - `TraceName.SendCompleted` would name exactly this step, but it is declared
 *   in `shared/lib/trace.ts` and never called — one of the dead members of that
 *   enum. Declaring a name does not emit a span.
 * - `TraceName.Transaction` is started only by `createTracingMiddleware`, keyed
 *   on the `eth_sendTransaction` JSON-RPC method and tagged `source: 'dapp'`
 *   (app/scripts/lib/createTracingMiddleware.ts), and ended on the same RPC
 *   path (app/scripts/lib/transaction/util.ts). This benchmark uses
 *   `createInternalTransaction`, the wallet's own send flow, which never issues
 *   that request — so the span is never opened.
 * - `TraceName.OnFinishedTransaction` does fire for an internal transaction
 *   (app/scripts/metamask-controller.js, `_onFinishedTransaction`), but it
 *   brackets post-confirmation bookkeeping — notification, NFT ownership,
 *   balance refresh — not the click-to-confirmed interval measured below.
 * - `TraceName.AccountOverviewActivityTab` is started when the Activity tab is
 *   clicked and ended only when the user clicks *away* to another tab
 *   (`handleTabClick` in
 *   ui/components/multichain/account-overview/account-overview-tabs.tsx). This
 *   flow never leaves the tab, so the span never closes and is never sent.
 *
 * Emitting one of the last three in place of the step would report a different
 * quantity under the step's name, so the harness clock is kept instead.
 */

import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import { createInternalTransaction } from '../../../page-objects/flows/transaction.flow';
import { Driver } from '../../../webdriver/driver';
import { buildLongTaskTimerResults } from '../../utils/long-task-helper';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
} from '../../../../../shared/constants/benchmarks';
import { runUserActionBenchmark, collectWebVitals } from '../../utils';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';

export const testTitle = 'benchmark-user-actions-confirm-tx';
export const persona = BENCHMARK_PERSONA.STANDARD;

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadingTimes: number = 0;
    const steps: LongTaskStepResult[] = [];
    let webVitals;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        disableServerMochaToBackground: true,
        title: testTitle,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        await createInternalTransaction({
          driver,
          recipientAddress: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          amount: '1',
        });

        await driver.resetLongTaskMetrics();
        const timestampBeforeAction = new Date();

        await driver.waitForSelector({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '[data-tx-status="confirmed"]',
          );
          return confirmedTxes.length === 1;
        }, 10000);
        await driver.waitForSelector('[data-tx-status="confirmed"]');
        const timestampAfterAction = new Date();
        loadingTimes =
          timestampAfterAction.getTime() - timestampBeforeAction.getTime();

        const longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'confirm_tx',
          duration: loadingTimes,
          longTaskCount: longTaskData?.count ?? 0,
          longTaskTotalDuration: longTaskData?.totalDuration ?? 0,
          longTaskMaxDuration: longTaskData?.maxDuration ?? 0,
          tbt: longTaskData?.tbt ?? 0,
        });

        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }
      },
    );

    return {
      timers: [
        ...steps.map((s) => ({ id: s.id, value: s.duration })),
        ...buildLongTaskTimerResults(steps),
      ],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
