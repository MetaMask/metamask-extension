/**
 * Benchmark: Standard Home Page Load
 * Measures home page load time with standard wallet state
 */

import type { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import {
  BENCHMARK_PERSONA,
  type BenchmarkResults,
  type WebVitalsMetrics,
} from '../../../../../shared/constants/benchmarks';
import { runPageLoadBenchmark, collectWebVitals } from '../../utils';
import {
  getIconArm,
  getIconTokenBalances,
  mockIcons,
  withIconTokens,
} from '../../utils/big-icon';
import {
  collectPaintTimings,
  installPaintObserver,
} from '../../utils/balance-paint';
import type {
  Metrics,
  PageLoadBenchmarkOptions,
  MeasurePageResult,
} from '../../utils/types';

async function measurePageStandard(
  pageName: string,
  pageLoads: number,
): Promise<MeasurePageResult> {
  const metrics: Metrics[] = [];
  const webVitalsRuns: WebVitalsMetrics[] = [];
  const title = 'measurePageStandard';
  const persona = BENCHMARK_PERSONA.STANDARD;
  const iconArm = getIconArm();
  const fixtureBuilder = new FixtureBuilderV2();
  await withFixtures(
    {
      fixtures: (iconArm
        ? withIconTokens(fixtureBuilder, iconArm)
        : fixtureBuilder
      ).build(),
      ...(iconArm && {
        unifiedEvmAccountsApiBalances: {
          mainnetAdditionalBalances: getIconTokenBalances(iconArm),
        },
        testSpecificMock: (server: Mockttp) => mockIcons(server, iconArm),
      }),
      disableServerMochaToBackground: true,
      title,
    },
    async ({ driver, getNetworkReport, clearNetworkReport }) => {
      await login(driver, { validateBalance: false });
      await installPaintObserver(driver);

      for (let i = 0; i < pageLoads; i++) {
        clearNetworkReport();
        await driver.navigate(pageName);
        await driver.delay(1000);

        const metricsThisLoad = await driver.collectMetrics();
        const diagnostics = await collectPaintTimings(driver);
        if (diagnostics.balancePainted !== null) {
          metricsThisLoad['Balance Painted'] = diagnostics.balancePainted;
        }
        if (diagnostics.tokenNamePainted !== null) {
          metricsThisLoad['Token Name Painted'] = diagnostics.tokenNamePainted;
        }
        if (diagnostics.tokenIconPainted !== null) {
          metricsThisLoad['Token Icon Painted'] = diagnostics.tokenIconPainted;
        }
        if (iconArm) {
          console.log(
            '[icon-arm]',
            JSON.stringify({
              iconArm,
              ...diagnostics,
            }),
          );
        }
        metricsThisLoad.numNetworkReqs = getNetworkReport().numNetworkReqs;
        metrics.push(metricsThisLoad);

        try {
          webVitalsRuns.push(await collectWebVitals(driver));
        } catch (error) {
          console.error(`Error collecting web vitals for ${pageName}:`, error);
        }
      }
    },
  );
  return { metrics, title, persona, webVitalsRuns };
}

export async function run(
  options: PageLoadBenchmarkOptions,
): Promise<BenchmarkResults> {
  return runPageLoadBenchmark(measurePageStandard, options);
}
