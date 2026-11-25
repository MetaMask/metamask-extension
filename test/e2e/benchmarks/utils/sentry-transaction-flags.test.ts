// origin: ai-synthesis
import fs from 'fs';
import path from 'path';
import * as Sentry from '@sentry/browser';
import browser from 'webextension-polyfill';
import { makeTransport } from '../../../../app/scripts/lib/sentry-make-transport';
import type { ManifestFlags } from '../../../../shared/lib/manifestFlags';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { setManifestFlags } from '../../set-manifest-flags';
import { getSentryTransactionManifestFlags } from './sentry-transaction-flags';

jest.mock('../../../../development/lib/get-manifest-flag', () => ({
  fetchManifestFlagsFromPRAndGit: async () => ({}),
}));

type Environment = { name: string; ci: boolean; performanceDsn: boolean };

const ENVIRONMENTS: Environment[] = [
  { name: 'CI with a performance DSN', ci: true, performanceDsn: true },
  { name: 'CI without one (forks)', ci: true, performanceDsn: false },
  { name: 'a local run', ci: false, performanceDsn: false },
];

const FLOWS_DIRECTORY = path.resolve(__dirname, '../flows/user-journey');
const POWER_USER_GENERATOR = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../../app/scripts/fixtures/generate-wallet-state.js',
  ),
  'utf8',
);
const FLOW_SOURCES = Object.fromEntries(
  ['asset-details.ts', 'solana-asset-details.ts'].map((flow) => [
    flow,
    fs.readFileSync(path.join(FLOWS_DIRECTORY, flow), 'utf8'),
  ]),
);

describe('getSentryTransactionManifestFlags', () => {
  const savedEnv = { ...process.env };
  let analyticsController: Record<string, unknown>;
  let fetchSpy: jest.SpyInstance;
  let writtenManifest = '';

  beforeAll(() => {
    // `generateWalletState` builds the power-user fixture on this builder and
    // never sets analytics state (checked below), so its default is the state.
    const { data } = new FixtureBuilderV2().build() as {
      data: Record<string, unknown>;
    };
    analyticsController = data.AnalyticsController as Record<string, unknown>;
  });

  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{"manifest_version":"3"}');
    jest.spyOn(fs, 'writeFileSync').mockImplementation((_file, contents) => {
      writtenManifest = String(contents);
    });
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => null },
    } as unknown as Response);
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    jest.restoreAllMocks();
  });

  // Runs the real `setManifestFlags` and transport, and reports whether an envelope is sent.
  const sendsEnvelope = async (
    flowFlags: ManifestFlags,
    environment: Environment,
    state: Record<string, unknown> = analyticsController,
  ): Promise<boolean> => {
    fetchSpy.mockClear();
    delete process.env.CI;
    delete process.env.SENTRY_DSN_PERFORMANCE;
    if (environment.ci) {
      process.env.CI = 'true';
    }
    if (environment.performanceDsn) {
      process.env.SENTRY_DSN_PERFORMANCE = 'https://key@sentry.io/1';
    }
    await setManifestFlags(flowFlags);

    jest
      .spyOn(browser.runtime, 'getManifest')
      .mockReturnValue(JSON.parse(writtenManifest));
    globalThis.stateHooks = {
      ...globalThis.stateHooks,
      getSentryState: () => ({ browser: 'jest', version: '0' }),
      getPersistedState: async () => ({ data: { AnalyticsController: state } }),
      getBackupState: async () => ({}),
    };

    const transport = makeTransport({
      url: 'https://public@fake.ingest.sentry.io/api/1/envelope/',
      headers: {},
      recordDroppedEvent: jest.fn(),
    } as unknown as Parameters<typeof Sentry.makeFetchTransport>[0]);
    const envelope = [{}, [[{ type: 'transaction' }, {}]]] as never;
    try {
      await transport.send(envelope);
    } catch {
      // A skipped send rejects; whether a request went out is read below.
    }
    return fetchSpy.mock.calls.length > 0;
  };

  it('starts from a power-user fixture that is opted out of MetaMetrics', () => {
    expect(POWER_USER_GENERATOR).not.toContain('withAnalyticsController');
    expect(analyticsController.optedIn).not.toBe(true);
  });

  for (const environment of ENVIRONMENTS) {
    it(`sends the envelope in ${environment.name}`, async () => {
      expect(
        await sendsEnvelope(getSentryTransactionManifestFlags(), environment),
      ).toBe(true);
    });
  }

  it('returns a fresh object each call, since `setManifestFlags` mutates it', () => {
    expect(getSentryTransactionManifestFlags()).not.toBe(
      getSentryTransactionManifestFlags(),
    );
  });

  describe('controls', () => {
    const SAMPLING_ONLY: ManifestFlags = { sentry: { tracesSampleRate: 1 } };

    it('drops the envelope under sampling alone outside a CI run with a performance DSN', async () => {
      const sent = [];
      for (const environment of ENVIRONMENTS) {
        sent.push(
          await sendsEnvelope(structuredClone(SAMPLING_ONLY), environment),
        );
      }
      expect(sent).toStrictEqual([true, false, false]);
    });

    it('sends the envelope once the fixture is opted in, with no flags', async () => {
      expect(
        await sendsEnvelope({}, ENVIRONMENTS[2], {
          ...analyticsController,
          optedIn: true,
        }),
      ).toBe(true);
    });
  });

  describe('flows reading Sentry transactions', () => {
    for (const [flow, source] of Object.entries(FLOW_SOURCES)) {
      it(`${flow} takes its Sentry flags from the helper`, () => {
        expect(source).toContain('...getSentryTransactionManifestFlags()');
      });
    }
  });
});
