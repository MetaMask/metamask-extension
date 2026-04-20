import * as mockttp from 'mockttp';
import { buildWebDriver } from '../../webdriver';
import FixtureServer from '../../fixtures/fixture-server';
import { setManifestFlags } from '../../set-manifest-flags';
import { PAGES, Driver } from '../../webdriver/driver';
import { ProdTestOptions, setupProductionMocking } from './prod-test-helpers';

/**
 * Production test wrapper - similar to withFixtures but for real network testing.
 *
 * Key differences from withFixtures:
 * - NO local blockchain (Anvil/Ganache)
 * - NO smart contract deployment
 * - Uses real RPC endpoints configured in fixtures
 * - Minimal mocking (only analytics/error tracking)
 * - All API requests go to real services
 *
 * @param options - Production test options
 * @param testSuite - Test function to execute
 */
export async function withProductionFixtures(
  options: ProdTestOptions,
  testSuite: (args: {
    driver: Driver;
    mockServer: mockttp.Mockttp;
    mockedEndpoint: mockttp.MockedEndpoint[];
  }) => Promise<void>,
): Promise<void> {
  const {
    fixtures,
    title,
    driverOptions,
    manifestFlags,
    ignoredConsoleErrors = [],
    disableServerMochaToBackground = false,
    testSpecificMock,
    extendedTimeoutMultiplier = 1,
    disableProxy = false,
  } = options;

  const fixtureServer = new FixtureServer();
  const https = disableProxy
    ? undefined
    : await mockttp.generateCACertificate();
  const mockServer = disableProxy
    ? null
    : mockttp.getLocal({ https, cors: true });

  let webDriver: unknown;
  let driver: Driver | undefined;
  let failed = false;

  try {
    console.log(`\n[PROD TEST] Starting: '${title}'\n`);

    // Start fixture server to inject wallet state
    await fixtureServer.start();
    fixtureServer.loadJsonState(fixtures, undefined); // No contract registry for prod tests

    let mockedEndpoint: mockttp.MockedEndpoint[] = [];

    if (!disableProxy && mockServer) {
      // Setup minimal mocking (analytics, error tracking only)
      mockedEndpoint = await setupProductionMocking(
        mockServer,
        testSpecificMock,
      );

      // Start mock server on port 8000 (for analytics/error tracking mocks)
      await mockServer.start(8000);
      console.log(
        '[PROD TEST] Proxy started on port 8000 (mocking analytics only)',
      );
    } else {
      console.log(
        '[PROD TEST] ⚠️  Proxy disabled - connecting directly to all services',
      );
      console.log(
        '[PROD TEST] ⚠️  Analytics and errors will be sent to production!',
      );
    }

    // Set manifest flags if provided
    await setManifestFlags(manifestFlags);

    // Build WebDriver with extension
    const wd = await buildWebDriver({
      ...driverOptions,
      disableServerMochaToBackground,
    });

    driver = wd.driver;

    // Apply extended timeout for slower network operations
    if (extendedTimeoutMultiplier > 1) {
      driver.timeout *= extendedTimeoutMultiplier;
    }

    webDriver = driver.driver;

    // Check for browser exceptions
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      await driver.checkBrowserForExceptions(ignoredConsoleErrors);
    }

    console.log(`\n[PROD TEST] Executing: '${title}'\n`);

    // Execute the test suite
    await testSuite({
      driver,
      mockServer: mockServer as mockttp.Mockttp, // Can be null if proxy disabled
      mockedEndpoint,
    });

    console.log(`\n[PROD TEST] Success: '${title}'\n`);
  } catch (error) {
    failed = true;

    if (webDriver && driver) {
      try {
        await driver.verboseReportOnFailure(title, error);
      } catch (verboseReportError) {
        console.error(
          '[PROD TEST] Error generating failure report:',
          verboseReportError,
        );
      }

      if (
        process.env.E2E_LEAVE_RUNNING !== 'true' &&
        (driver.errors.length > 0 || driver.exceptions.length > 0)
      ) {
        await driver.navigate(PAGES.BACKGROUND);
      }
    }

    throw error;
  } finally {
    // Cleanup
    const leaveRunning = process.env.E2E_LEAVE_RUNNING === 'true';
    const keepProxy = process.env.E2E_KEEP_PROXY === 'true';

    if (webDriver && driver && !leaveRunning) {
      await driver.quit();
    } else if (webDriver && driver && leaveRunning) {
      console.log('\n[PROD TEST] ✅ Browser left running for manual testing');

      if (keepProxy) {
        console.log('[PROD TEST] ✅ Proxy kept running on port 8000');
        console.log('[PROD TEST] 💡 Chrome will continue to work normally');
        console.log('[PROD TEST] 💡 Press Ctrl+C to stop the proxy and exit\n');

        // Keep the process alive so proxy stays running
        // eslint-disable-next-line no-empty-function
        await new Promise(() => {}); // Never resolves - keeps process alive
      } else {
        console.log(
          '[PROD TEST] ⚠️  Proxy will be stopped - Chrome will lose connectivity',
        );
        console.log(
          '[PROD TEST] 💡 To keep proxy running: E2E_KEEP_PROXY=true',
        );
        console.log('[PROD TEST] 💡 Or disable proxy in Chrome settings\n');
      }
    }

    if (mockServer && !keepProxy) {
      await mockServer.stop();
    }

    if (fixtureServer) {
      await fixtureServer.stop();
    }

    if (failed) {
      console.log(`\n[PROD TEST] Failed: '${title}'\n`);
    }
  }
}
