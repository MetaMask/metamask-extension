import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getCleanAppState, withFixtures, sentryRegEx } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import LoginPage from '../../page-objects/pages/login-page';
import { MOCK_ANALYTICS_ID } from '../../constants';

/**
 * Delivery tests for the `sentry` remote feature flag.
 *
 * These deliberately mock the **client-config API response**, not the
 * controller's persisted state. Seeding `RemoteFeatureFlagController` state
 * directly (over CDP, or via a fixture) puts the value in place before boot,
 * which means the `sentry-install` / `setup-initial-state-hooks` ordering race
 * that `applySentryRemoteRates` guards against cannot occur — a passing arm
 * would then be indistinguishable from a passing arm on unfixed code. Serving
 * the value over HTTP keeps the fetch genuinely asynchronous, so the fetch,
 * the controller's parse and validation, the persistence write and the hook
 * timing are all exercised for real.
 *
 * The sampler's own precedence arithmetic is covered exhaustively by
 * `app/scripts/lib/sentry-traces-sampler.test.ts`; what cannot be unit-tested
 * is whether the value ever arrives. That is what these cover.
 *
 * Not covered here, and not coverable client-side: LaunchDarkly's own rule
 * evaluation. Mocking the response cannot show that LD would serve it, so
 * `clientVersion` targeting needs a dashboard check instead.
 */

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

type SentryFlag = {
  tracesSampleRate?: number;
  wrapperSampleRate?: number;
  transactionSampleRates?: Record<string, number>;
};

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

/**
 * Serve the flags endpoint and capture Sentry transaction envelopes, so an arm
 * can assert on what the sampler actually let through rather than only on what
 * landed in state.
 *
 * @param sentry - The `sentry` flag value to serve.
 * @returns A `testSpecificMock` function whose first endpoint is the flags
 * endpoint and whose second collects transaction envelopes.
 */
function mockFlagsAndSentryIngest(sentry: SentryFlag) {
  return async (mockServer: Mockttp) => {
    const flagsEndpoint = await mockServer
      .forGet(FEATURE_FLAGS_URL)
      .withQuery({ client: 'extension', distribution: 'main' })
      .thenCallback(() => ({ statusCode: 200, json: [{ sentry }] }));

    const transactionEndpoint = await mockServer
      .forPost(sentryRegEx)
      .withBodyIncluding('"type":"transaction"')
      .thenCallback(() => ({ statusCode: 200, json: {} }));

    return [flagsEndpoint, transactionEndpoint];
  };
}

const withMetaMetricsOn = () =>
  new FixtureBuilderV2()
    .withMetaMetricsController({
      analyticsId: MOCK_ANALYTICS_ID,
      completedMetaMetricsOnboarding: true,
      optedIn: true,
    })
    .build();

describe('Sentry remote sample rates', function (this: Suite) {
  it('delivers the sentry flag from the client-config API into controller state', async function () {
    const sentry = {
      tracesSampleRate: 1,
      wrapperSampleRate: 1,
      transactionSampleRates: { UIStartup: 0 },
    };

    await withFixtures(
      {
        fixtures: withMetaMetricsOn(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockFlagsWithSentry(sentry),
      },
      async ({ driver, mockedEndpoint }) => {
        await login(driver);
        const uiState = await getCleanAppState(driver);

        // Proves the whole read path, not just that a value can be read back:
        // the extension fetched over HTTP, the controller parsed and validated
        // the payload, and it was persisted where `applySentryRemoteRates`
        // looks for it.
        assert.deepStrictEqual(
          uiState.metamask.remoteFeatureFlags.sentry,
          sentry,
          'the served sentry flag should reach RemoteFeatureFlagController state verbatim',
        );

        // Positive control for the request counter used by the
        // basic-functionality-off arm below. Without this, a zero there is
        // equally consistent with "the controller is disabled" and with
        // "getSeenRequests never observes anything in this harness", and the
        // arm would pass while measuring nothing.
        const [flagsEndpoint] = mockedEndpoint;
        assert.ok(
          (await flagsEndpoint.getSeenRequests()).length > 0,
          'the flags endpoint should record requests when the controller is enabled',
        );
      },
    );
  });

  it('leaves the flag absent when the response carries no sentry key', async function () {
    // Negative control. Without this, an arm that silently serves nothing and
    // an arm that delivers correctly are indistinguishable — both would show a
    // client running on compile-time rates.
    await withFixtures(
      {
        fixtures: withMetaMetricsOn(),
        title: this.test?.fullTitle(),
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
  });

  it('never requests flags at all when basic functionality is off', async function () {
    // The third cell of the matrix. This is not a startup transient: the
    // controller is constructed disabled in this state, so these users stay on
    // compile-time rates permanently and no remote throttle can reach them.
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockFlagsWithSentry({ tracesSampleRate: 1 }),
      },
      async ({ driver, mockedEndpoint }) => {
        // Deliberately NOT `login(driver)`. The login flow ends by checking the
        // home page is loaded, which waits on the Bitcoin account icon — that
        // never renders with external services off, so the flow times out after
        // 20s on a selector unrelated to this claim. The unlock screen is the
        // strongest ready signal that does not itself depend on the services
        // this arm switches off.
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        // The controller would fetch at background init, so the UI being up
        // already means a request would have been issued. Settle anyway, so the
        // zero below is "did not fetch" rather than "has not fetched yet" — a
        // longer wait can only strengthen a no-request assertion.
        await driver.delay(5000);

        const [flagsEndpoint] = mockedEndpoint;
        const seen = await flagsEndpoint.getSeenRequests();
        assert.equal(
          seen.length,
          0,
          'a disabled controller should issue no flags request; a served-but-unfetched flag is not an "off" arm',
        );
      },
    );
  });

  it('applies the remote rate to real ingest: transactions arrive at rate 1', async function () {
    await withFixtures(
      {
        fixtures: withMetaMetricsOn(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockFlagsAndSentryIngest({ tracesSampleRate: 1 }),
      },
      async ({ driver, mockedEndpoint }) => {
        await login(driver);

        // 30s rather than 15s: the Firefox MV2 build cleared 15s on neither of
        // two attempts while Chrome passed both, and a batched transaction
        // envelope on the slower build is the likeliest cause. If this still
        // times out on Firefox the cause is structural rather than budgetary,
        // and the arm should be Chrome-gated
        // (`process.env.SELENIUM_BROWSER === Browser.FIREFOX` → `this.skip()`)
        // with the coverage gap stated, not given a longer timeout again.
        const [, transactionEndpoint] = mockedEndpoint;
        await driver.wait(async () => {
          const seen = await transactionEndpoint.getSeenRequests();
          return seen.length > 0;
        }, 30000);

        const seen = await transactionEndpoint.getSeenRequests();
        assert.ok(
          seen.length > 0,
          'with a remote tracesSampleRate of 1 the sampler should let transactions through, which also proves the rate reached the sampler and not merely state',
        );
      },
    );
  });
});
