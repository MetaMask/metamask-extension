import { Mockttp } from 'mockttp';
import { withFixtures } from '../../e2e/helpers';
import { loginWithBalanceValidation } from '../../e2e/page-objects/flows/login.flow';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import { Driver } from '../../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import BridgeQuotePage from '../../e2e/page-objects/pages/bridge/quote-page';
import { getBridgeFixtures } from '../../e2e/tests/bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../../e2e/tests/bridge/constants';
import { mockDelayedQuoteStream } from '../utils/performanceMocks';

describe('Unified Bridge & Swap Performance', function () {
  setupPerformanceReporting();

  it('measures swap page load and quote fetching time', async function () {
    const baseFixtures = getBridgeFixtures(
      this.test?.fullTitle(),
      BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      false, // withErc20
      false, // withMockedSegment
    );

    const fixtures = {
      ...baseFixtures,
      testSpecificMock: async (mockServer: Mockttp) => {
        await mockDelayedQuoteStream(mockServer);
        return (await baseFixtures.testSpecificMock?.(mockServer)) ?? [];
      },
    };

    await withFixtures(fixtures, async ({ driver }: { driver: Driver }) => {
      const timerLogin = new TimerHelper('Time to login', 10000);
      const timerOpenSwapPage = new TimerHelper(
        'Time to open swap page from home',
        5000,
      );
      const timerQuoteFetching = new TimerHelper(
        'Time to fetch and display swap quotes',
        2000,
      );

      // Login flow with balance validation (same as working tests)
      await timerLogin.measure(async () => {
        await loginWithBalanceValidation(driver, undefined, undefined, '$0');
      });
      performanceTracker.addTimer(timerLogin);

      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.goToTokensTab();

      // Measure: Open swap page
      await homePage.startSwapFlow();
      const bridgePage = new BridgeQuotePage(driver);
      await timerOpenSwapPage.measure(async () => {
        // Wait for swap page to be loaded (source asset picker button appears)
        await driver.waitForSelector(bridgePage.sourceAssetPickerButton);
      });
      performanceTracker.addTimer(timerOpenSwapPage);

      // Measure: Quote fetching (uses default tokens - ETH to MUSD via mock)
      await timerQuoteFetching.measure(async () => {
        await bridgePage.enterBridgeQuote({
          amount: '1',
        });
        await bridgePage.waitForQuote();
      });
      performanceTracker.addTimer(timerQuoteFetching);
    });
  });
});
