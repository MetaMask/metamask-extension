import { resolve } from 'path';
import { existsSync, promises as fs } from 'fs';
import { strict as assert } from 'assert';
import { CompletedRequest, MockttpServer } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures, sentryRegEx } from '../../helpers';
import { MOCK_ANALYTICS_ID } from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import {
  parseSentryEnvelopes,
  summarizeCoverage,
  diffCoverage,
  type CoverageSummary,
} from '../../helpers/sentry-coverage';

/**
 * Sentry coverage-equivalence harness (#43819).
 *
 * Captures the FULL set of envelopes the extension sends to Sentry during a
 * fixed flow, normalizes away volatile ids/timestamps, and compares against a
 * committed baseline. The point is to verify an SDK migration (v8 → v10,
 * PR #42867) produces equivalent telemetry — the same errors, transactions,
 * tags, and volume — rather than trusting a green suite.
 *
 * The fixed flow is the #43819 scenario: unlock (eager `session` envelope +
 * `UI Startup` / `/home.html` pageload transactions) → trigger a known
 * developer-options error (`event`). We wait until all three envelope
 * categories have been POSTed before snapshotting, so we capture the full set
 * rather than just the eager session envelope.
 *
 * Workflow (run the same flow on each side). First, on `main` (v8), run with
 * `UPDATE_SENTRY_COVERAGE_BASELINE=true` to write
 * `state-snapshots/sentry-coverage-baseline.json`. Then, on the v10 branch, run
 * without the env var: it diffs against the baseline and fails on any structural
 * delta (added/removed item, dropped tag, volume change), each then triaged
 * benign (timing) vs regression.
 *
 * The baseline is intentionally NOT committed here — it must be generated from a
 * v8 build so it captures the reference behavior, not whatever SDK is checked out.
 */
const BASELINE_PATH = resolve(
  __dirname,
  './state-snapshots/sentry-coverage-baseline.json',
);
const UPDATE_BASELINE = process.env.UPDATE_SENTRY_COVERAGE_BASELINE === 'true';

// The fixed flow emits three envelope categories; wait until all have arrived
// (or the cap elapses) before snapshotting, so we never capture a half-flushed
// batch: `session` is eager, the pageload `transaction`s follow UI Startup, and
// the developer-options error `event` is the last to flush.
const REQUIRED_TYPES = ['session', 'event', 'transaction'];
const MAX_WAIT_FOR_ENVELOPES_MS = 30_000;
// Let stragglers (e.g. a second pageload transaction) accumulate after the
// required set has arrived before snapshotting.
const SETTLE_MS = 5_000;

// Outrank mock-e2e.js's global Sentry DSN handlers — they are registered after
// `testSpecificMock` and so otherwise win the match, leaving this endpoint with
// only a fraction of the envelopes. With a higher priority our one endpoint
// intercepts EVERY Sentry envelope (both DSNs), independent of the per-branch
// mock-e2e setup, so the capture is the full per-flow set.
const SENTRY_CAPTURE_PRIORITY = 100;

// A manual cross-build harness, not a standard always-on e2e check: generate
// the baseline on v8 (`UPDATE_SENTRY_COVERAGE_BASELINE=true`), then compare on
// v10. The baseline is intentionally not committed, so skip by default in normal
// CI runs rather than fail on a missing baseline.
// CAPTURE branch (#42867 telemetry validation): always run, log the coverage
// summary for offline v8-vs-v10 diffing. Not for merge.
const runOrSkip = it;
void UPDATE_BASELINE;
void BASELINE_PATH;
void existsSync;

describe('Sentry coverage equivalence (#43819)', function () {
  runOrSkip(
    'captures the envelope set for a fixed flow and matches the v8 baseline',
    async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              analyticsId: MOCK_ANALYTICS_ID,
              completedMetaMetricsOnboarding: true,
              optedIn: true,
            })
            .build(),
          title: this.test?.fullTitle(),
          // Capture EVERY Sentry POST (no `withBodyIncluding` filter), returning a
          // 200 so the SDK doesn't retry. One high-priority endpoint accumulates
          // all envelopes — error DSN and performance DSN both match `sentryRegEx`.
          testSpecificMock: async (mockServer: MockttpServer) =>
            mockServer
              .forPost(sentryRegEx)
              .asPriority(SENTRY_CAPTURE_PRIORITY)
              .thenCallback(() => ({ statusCode: 200, json: {} })),
          // optedIn already enables Sentry; force 100% trace sampling so the
          // pageload transactions are emitted deterministically.
          manifestFlags: {
            sentry: { forceEnable: false, tracesSampleRate: 1 },
          },
          // The developer-options test error logs to the console by design.
          ignoredConsoleErrors: ['TestError'],
        },
        async ({ driver, mockedEndpoint }) => {
          // Unlock → session envelope + UI Startup / /home.html pageload
          // transactions. Skip the non-EVM/snap-discovery wait (#43817) and
          // balance validation — irrelevant to telemetry and a flake source.
          await login(driver, {
            validateBalance: false,
            waitForNonEvmAccounts: false,
          });

          // Trigger a deterministic error captured by Sentry via the
          // developer-options hook, so every run emits a comparable error event.
          await driver.executeScript(
            'window.stateHooks.throwTestError("Sentry coverage equivalence error")',
          );

          // Wait until all three envelope categories have been POSTed (or the cap
          // elapses), then settle for stragglers — so we snapshot the full set,
          // not just the eager session envelope.
          await driver
            .wait(async () => {
              const seen = await mockedEndpoint.getSeenRequests();
              const bodies = await Promise.all(
                seen.map((request: CompletedRequest) => request.body.getText()),
              );
              const types = new Set(
                parseSentryEnvelopes(bodies).map((item) => item.type),
              );
              return REQUIRED_TYPES.every((type) => types.has(type));
            }, MAX_WAIT_FOR_ENVELOPES_MS)
            .catch(() => undefined);
          await driver.delay(SETTLE_MS);

          const requests = await mockedEndpoint.getSeenRequests();
          const rawBodies = await Promise.all(
            requests.map((request: CompletedRequest) => request.body.getText()),
          );
          const current = summarizeCoverage(parseSentryEnvelopes(rawBodies));

          // CAPTURE: emit the coverage summary for offline v8-vs-v10 diffing.
          const sdkVersion = process.env.SENTRY_COVERAGE_SDK ?? 'unknown';
          // eslint-disable-next-line no-console
          console.log(
            `[SENTRY-COVERAGE-SUMMARY] ${JSON.stringify({
              sdk: sdkVersion,
              countsByType: current.countsByType,
              itemCount: current.items.length,
              signatures: current.items.map((item) => item.signature).sort(),
              tagKeysBySignature: Object.fromEntries(
                current.items.map((item) => [item.signature, item.tagKeys]),
              ),
            })}`,
          );
          return;

          // eslint-disable-next-line no-unreachable
          if (UPDATE_BASELINE) {
            await fs.writeFile(
              BASELINE_PATH,
              `${JSON.stringify(current, null, 2)}\n`,
            );
            console.log(
              `Wrote Sentry coverage baseline (${current.items.length} items) to ${BASELINE_PATH}`,
            );
            return;
          }

          const baselineRaw = await fs
            .readFile(BASELINE_PATH, 'utf8')
            .catch(() => {
              throw new Error(
                `No Sentry coverage baseline at ${BASELINE_PATH}. Generate it on a v8 build first: ` +
                  `UPDATE_SENTRY_COVERAGE_BASELINE=true run this spec.`,
              );
            });
          const baseline = JSON.parse(baselineRaw) as CoverageSummary;
          const diff = diffCoverage(baseline, current);

          assert.ok(
            diff.equivalent,
            `Sentry coverage diverged from the v8 baseline — triage each delta as benign (timing) vs regression:\n${JSON.stringify(
              diff,
              null,
              2,
            )}`,
          );
        },
      );
    },
  );
});
