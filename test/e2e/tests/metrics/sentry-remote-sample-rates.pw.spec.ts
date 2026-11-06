import { strict as assert } from 'assert';
import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { E2E_DRIVER, MOCK_ANALYTICS_ID } from '../../constants';

/**
 * Whether the client requests the `sentry` remote feature flag.
 * Sampler arithmetic, the persist/apply race, and versions-ladder unwrapping
 * live in unit tests (`sentry-traces-sampler.test.ts`,
 * `sentry-remote-rates.test.ts`). These arms do not read extension state:
 * Playwright's page.evaluate cannot run on a Firefox extension page under
 * LavaMoat scuttling.
 */

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

type SentryRates = {
  tracesSampleRate?: number;
  wrapperSampleRate?: number;
  transactionSampleRates?: Record<string, number>;
};

/**
 * The flag accepts either a flat rates object or a version ladder. The ladder is
 * unwrapped by the controller before it reaches state, never by this codebase.
 */
type SentryFlag = SentryRates | { versions: Record<string, SentryRates> };

/**
 * Serve the flags endpoint with (or without) a `sentry` entry.
 *
 * Registered via `testSpecificMock`, which runs before the registry-backed
 * default handler, so this wins on Mockttp's first-match-wins ordering.
 *
 * @param sentry - The `sentry` flag value to serve, or `undefined` to serve a
 * response with no `sentry` key at all (the absent cell).
 * @returns A `testSpecificMock` function.
 */
function mockFlagsWithSentry(sentry?: SentryFlag) {
  return async (mockServer: Mockttp) => {
    const flags = sentry === undefined ? [{ unrelated: true }] : [{ sentry }];
    return [
      await mockServer
        .forGet(FEATURE_FLAGS_URL)
        .withQuery({ client: 'extension', distribution: 'main' })
        .thenCallback(() => ({ statusCode: 200, json: flags })),
    ];
  };
}

const withMetaMetricsOn = () =>
  new FixtureBuilderV2()
    .withAnalyticsController({
      analyticsId: MOCK_ANALYTICS_ID,
      consentDecisionMade: true,
      optedIn: true,
    })
    .build();

pwTest.describe('Sentry remote sample rates', () => {
  pwTest(
    'requests the flags endpoint when a sentry flag is served',
    async () => {
      const sentry = {
        tracesSampleRate: 1,
        wrapperSampleRate: 1,
        transactionSampleRates: { UIStartup: 0 },
      };

      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: withMetaMetricsOn(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockFlagsWithSentry(sentry),
        },
        async ({ driver, mockedEndpoint }) => {
          await login(driver);

          const [flagsEndpoint] = mockedEndpoint;
          assert.ok(
            (await flagsEndpoint.getSeenRequests()).length > 0,
            'the flags endpoint should record requests when the controller is enabled',
          );
        },
      );
    },
  );

  pwTest(
    'never requests flags at all when basic functionality is off',
    async () => {
      // The third cell of the matrix. This is not a startup transient: the
      // controller is constructed disabled in this state, so these users stay on
      // compile-time rates permanently and no remote throttle can reach them.
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withUseBasicFunctionalityDisabled()
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockFlagsWithSentry({ tracesSampleRate: 1 }),
        },
        async ({ driver, mockedEndpoint }) => {
          // Basic-functionality-off fixtures do not render a stable login
          // surface; assert against the flags endpoint instead of the DOM.
          await driver.delay(10000);

          const [flagsEndpoint] = mockedEndpoint;
          const seen = await flagsEndpoint.getSeenRequests();
          assert.equal(
            seen.length,
            0,
            'a disabled controller should issue no flags request; a served-but-unfetched flag is not an "off" arm',
          );
        },
      );
    },
  );
});
