import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getCleanAppState, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { MOCK_ANALYTICS_ID } from '../../constants';

/**
 * Delivery tests for the `sentry` remote feature flag.
 *
 * Scope: **delivery**. These assert that a value served by the client-config
 * API arrives in `RemoteFeatureFlagController` state in the shape
 * `applySentryRemoteRates` expects. They mock the HTTP response rather than
 * seeding controller state, so the fetch, the controller's parse and its
 * version-ladder unwrapping all run for real.
 *
 * What they do NOT assert: that the delivered value is then applied to the
 * sampler. No arm observes `applySentryRemoteRates`, the `tracesSampler`, or
 * an emitted sample rate, so all four pass unchanged on code where the
 * `sentry-install` / `setup-initial-state-hooks` race is unfixed. That race is
 * covered by unit tests in `shared/lib/sentry-remote-rates.test.ts`; covering
 * it here would need an arm asserting an applied rate.
 *
 * The sampler's own precedence arithmetic is covered exhaustively by
 * `app/scripts/lib/sentry-traces-sampler.test.ts`; what cannot be unit-tested
 * is whether the value ever arrives. That is what these cover.
 *
 * Per-release behaviour is client-side, so it *is* coverable here: the service
 * returns the whole `versions` ladder and the controller selects the rung — the
 * `clientVersion` request parameter selects nothing server-side, confirmed by
 * probing the live endpoint with it varied and getting identical payloads. The
 * last arm covers the selection.
 *
 * What remains outside any client-side test is LaunchDarkly's own evaluation of
 * on/off and targeting rules. Mocking the response cannot show that LD would
 * serve it; that part is settled from the flag configuration instead.
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

        // The extension fetched over HTTP and the controller parsed and
        // validated the payload into state. Note `getCleanAppState` reads
        // in-memory UI state, not the persisted store `applySentryRemoteRates`
        // reads from — so this establishes delivery, not that the value is
        // where the consumer will find it at init.
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
        // No UI wait at all. Two selectors were tried and both failed for the
        // same underlying reason: this fixture's rendering depends on the
        // services the arm switches off (`login()` ends on the Bitcoin account
        // icon; `LoginPage.checkPageIsLoaded()` waits on
        // `unlock-forgot-password-button`). Neither is what the claim is about
        // — the claim is purely that no request reaches the flags endpoint, so
        // it is asserted against the network and not the DOM.
        //
        // The controller is constructed at background init, which `withFixtures`
        // has already completed, so a request would have been issued before this
        // point. The delay only widens the window; for a no-request assertion a
        // longer wait can strengthen it and cannot weaken it. The guard against
        // a vacuous zero is the positive control in the first test, which proves
        // this same counter does observe requests when the controller is enabled.
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
  });

  it('unwraps a versions ladder to the rung matching the build version', async function () {
    // The one link in the chain that source-reading cannot settle. Everything
    // else here asserts our own code; this asserts the controller's:
    // `isVersionFeatureFlag` recognises a `versions` map of SemVer keys and
    // `getVersionData` selects the highest rung at or below the build's own
    // version, writing the UNWRAPPED rates object to state. If that contract
    // ever changes, `applySentryRemoteRates` silently receives a shape it does
    // not understand and every rate falls back to its compile-time constant.
    //
    // The ladder is bracketed so the assertion discriminates. A lone rung
    // would be satisfied by almost any selection rule. Two rungs whose values
    // differ rule out "take the last" and "take the highest"; listing the
    // unreachable rung FIRST also rules out "take the first", since the keys
    // are non-integer strings and so iterate in insertion order.
    const ladder = {
      versions: {
        '999.0.0': { tracesSampleRate: 0.75 },
        '0.0.1': { tracesSampleRate: 0.25 },
      },
    };

    await withFixtures(
      {
        fixtures: withMetaMetricsOn(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockFlagsWithSentry(ladder),
      },
      async ({ driver }) => {
        await login(driver);
        const uiState = await getCleanAppState(driver);
        const { sentry } = uiState.metamask.remoteFeatureFlags;

        // No build is at 999.0.0, so the 0.0.1 rung wins. Asserting the whole
        // object rather than one key also proves the `versions` wrapper is gone
        // — if the controller passed the raw ladder through, this fails.
        assert.deepStrictEqual(
          sentry,
          { tracesSampleRate: 0.25 },
          'state should hold the unwrapped rung for the build version, not the versions wrapper',
        );
      },
    );
  });
});
