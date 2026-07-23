/**
 * verify-7489-traceparent-parent.spec.ts — MetaMask-planning#7489
 *
 * Does the outbound `traceparent` on a backend (api.cx.metamask.io) request name
 * the request's own `http.client` span, or the enclosing custom operation root?
 *
 *   NESTED  — parent-id == an emitted http.client span id  (v10 fix works)
 *   SIBLING — parent-id == a custom/transaction root span id (13.39.1 behaviour)
 *   PHANTOM — parent-id matches no emitted span id
 *
 * Runs under the e2e harness (IN_TEST → FAKE DSN → Sentry initialises,
 * tracesSampleRate 1.0; the mock forwards envelopes) with a pre-onboarded fixture,
 * so it needs no onboarding driver. Captures both the backend traceparent and the
 * Sentry envelope spans, joins them, and writes the result to /tmp for inspection.
 */
import { writeFileSync } from 'fs';
import { MockttpServer } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { addAccount } from '../../page-objects/flows/add-account.flow';

const BACKEND = /^https:\/\/[a-z0-9.-]+\.(?:[a-z0-9]+-)?api\.cx\.metamask\.io/u;
const OUT = '/tmp/verify-7489-e2e-result.json';

// Passive capture: observe requests WITHOUT replacing responses, so the app
// boots on the default e2e mocks and the account operation produces real spans.
const capturedBackend: { url: string; traceparent?: string }[] = [];
const capturedEnvelopes: string[] = [];

async function captureMocks(mockServer: MockttpServer) {
  mockServer.on('request', async (req) => {
    try {
      if (BACKEND.test(req.url)) {
        capturedBackend.push({
          url: req.url.split('?')[0],
          traceparent: req.headers.traceparent as string | undefined,
        });
      } else if (/sentry\.io\/api\/\d+\/envelope/u.test(req.url)) {
        const body = await req.body.getText().catch(() => '');
        if (body) {
          capturedEnvelopes.push(body);
        }
      }
    } catch {
      /* observation only */
    }
  });
  return [];
}

function parseEnvelopes(bodies: string[]) {
  const spans = new Map<
    string,
    { op: string; desc: string; parent?: string }
  >();
  for (const body of bodies) {
    for (const line of body.split('\n')) {
      if (!line.trim()) continue;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      const t = obj?.contexts?.trace;
      if (t?.span_id) {
        spans.set(t.span_id, {
          op: t.op ?? 'transaction-root',
          desc: obj.transaction ?? '',
          parent: t.parent_span_id,
        });
      }
      for (const s of obj?.spans ?? []) {
        spans.set(s.span_id, {
          op: s.op ?? '',
          desc: s.description ?? '',
          parent: s.parent_span_id,
        });
      }
    }
  }
  return spans;
}

describe('verify-7489: backend traceparent parent identity', function () {
  it('captures traceparent parent-id vs emitted http.client span id', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: captureMocks,
        manifestFlags: { sentry: { tracesSampleRate: 1 } },
      },
      async ({ driver }) => {
        await login(driver);
        await addAccount({ driver }).catch(() => {
          /* capture regardless of flow success */
        });
        await driver.delay(8000);

        const backendReqs = capturedBackend;
        const spans = parseEnvelopes(capturedEnvelopes);

        const rows = [];
        for (const r of backendReqs) {
          const tp = r.traceparent;
          if (!tp) {
            rows.push({
              url: r.url.split('?')[0],
              traceparent: null,
              verdict: 'NO-TP',
            });
            continue;
          }
          const m = /^00-([0-9a-f]{32})-([0-9a-f]{16})-(0[01])$/u.exec(tp);
          const parent = m?.[2];
          const hit = parent ? spans.get(parent) : undefined;
          let verdict = 'PHANTOM';
          if (hit?.op === 'http.client') verdict = 'NESTED';
          else if (hit) verdict = `SIBLING(${hit.op}:${hit.desc.slice(0, 40)})`;
          rows.push({
            url: r.url.split('?')[0],
            parent,
            flags: m?.[3],
            verdict,
          });
        }

        const summary = { nested: 0, sibling: 0, phantom: 0, noTp: 0 };
        for (const r of rows) {
          if (r.verdict === 'NESTED') summary.nested += 1;
          else if (r.verdict === 'NO-TP') summary.noTp += 1;
          else if (String(r.verdict).startsWith('SIBLING'))
            summary.sibling += 1;
          else summary.phantom += 1;
        }
        const out = {
          backendRequests: backendReqs.length,
          withTraceparent: rows.filter((r) => r.verdict !== 'NO-TP').length,
          envelopes: capturedEnvelopes.length,
          emittedSpans: spans.size,
          httpClientSpans: [...spans.values()].filter(
            (s) => s.op === 'http.client',
          ).length,
          summary,
          rows,
        };
        writeFileSync(OUT, JSON.stringify(out, null, 2));
        console.log(
          'VERIFY-7489-RESULT',
          JSON.stringify(summary),
          `backend=${backendReqs.length} tp=${out.withTraceparent} env=${capturedEnvelopes.length} spans=${spans.size}`,
        );
      },
    );
  });
});
