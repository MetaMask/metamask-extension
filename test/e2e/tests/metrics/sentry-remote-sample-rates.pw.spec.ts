import { strict as assert } from 'assert';
import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getCleanAppState, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { E2E_DRIVER, MOCK_ANALYTICS_ID } from '../../constants';

/**
 * Delivery of the `sentry` remote feature flag over HTTP into
 * `RemoteFeatureFlagController`. Sampler arithmetic and the persist/apply race
 * live in unit tests (`sentry-traces-sampler.test.ts`,
 * `sentry-remote-rates.test.ts`); these arms only prove the value arrives (or
 * is never requested) and that a versions ladder is unwrapped.
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
    .withMetaMetricsController({
      analyticsId: MOCK_ANALYTICS_ID,
      consentDecisionMade: true,
      optedIn: true,
    })
    .build();

pwTest.describe('Sentry remote sample rates', () => {
  pwTest(
    'delivers the sentry flag from the client-config API into controller state',
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
          const uiState = await getCleanAppState(driver);

          assert.deepStrictEqual(
            uiState.metamask.remoteFeatureFlags.sentry,
            sentry,
            'the served sentry flag should reach RemoteFeatureFlagController state verbatim',
          );

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
    'leaves the flag absent when the response carries no sentry key',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: withMetaMetricsOn(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockFlagsWithSentry(undefined),
        },
        async ({ driver }) => {
          await login(driver);
          const uiState = await getCleanAppState(driver);

          assert.equal(
            uiState.metamask.remoteFeatureFlags.sentry,
            undefined,
            'no sentry flag should be present, so compile-time rates apply',
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

  pwTest(
    'unwraps a versions ladder to the rung matching the build version',
    async () => {
      const ladder = {
        versions: {
          '999.0.0': { tracesSampleRate: 0.75 },
          '0.0.1': { tracesSampleRate: 0.25 },
        },
      };

      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: withMetaMetricsOn(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockFlagsWithSentry(ladder),
        },
        async ({ driver }) => {
          await login(driver);
          const uiState = await getCleanAppState(driver);
          const { sentry } = uiState.metamask.remoteFeatureFlags;

          assert.deepStrictEqual(
            sentry,
            { tracesSampleRate: 0.25 },
            'state should hold the unwrapped rung for the build version, not the versions wrapper',
          );
        },
      );
    },
  );
});
