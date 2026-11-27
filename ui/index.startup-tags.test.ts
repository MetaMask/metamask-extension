import * as Sentry from '@sentry/browser';
import type {
  Envelope,
  EnvelopeItem,
  SerializedStreamedSpan,
  SerializedStreamedSpanContainer,
} from '@sentry/core';
import * as browserRuntimeUtils from '../shared/lib/browser-runtime.utils';
import { endTrace, trace, TraceName } from '../shared/lib/trace';
// eslint-disable-next-line import-x/no-restricted-paths
import { getClientOptions } from '../app/scripts/lib/setupSentry';
import defaultMockState from '../test/data/mock-state.json';
import * as selectors from './selectors';
import * as metamaskBaseSelectors from './ducks/metamask/base-selectors';
import { getStartupTraceTags } from './helpers/utils/tags';
import { launchMetamaskUi } from '.';

jest.mock('../shared/lib/manifestFlags', () => ({
  getManifestFlags: () => ({}),
}));

jest.mock('../shared/lib/i18n', () => ({
  fetchLocale: jest.fn(() => ({})),
  loadRelativeTimeFormatLocaleData: jest.fn(),
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

jest.mock('./pages', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
  router: {},
}));

jest.mock('./pages/confirmations/confirmation-performance');
jest.mock('./pages/home/home-performance');
jest.mock('./pages/unlock-page/unlock-performance');
jest.mock('./helpers/utils/web-vitals');

jest.mock('./selectors', () => ({
  ...jest.requireActual('./selectors'),
  getNetworkToAutomaticallySwitchTo: jest.fn(),
  getFirstTimeFlowType: jest.fn(),
  getIsSocialLoginFlow: jest.fn(),
}));

jest.mock('./ducks/metamask/base-selectors', () => ({
  ...jest.requireActual('./ducks/metamask/base-selectors'),
  getIsUnlocked: jest.fn(),
}));

// Streamed spans carry no tags, so the startup tags dashboards read as
// `tags[wallet.*]` must be attributes on the `UI Startup` segment span.
describe('UI startup tags (real Sentry SDK in stream mode)', () => {
  let envelopes: Envelope[];

  const sentSpans = (): SerializedStreamedSpan[] =>
    envelopes
      .flatMap(([, items]) => items as EnvelopeItem[])
      .filter(([header]) => header.type === 'span')
      .flatMap(
        ([, payload]) => (payload as SerializedStreamedSpanContainer).items,
      );

  beforeEach(() => {
    envelopes = [];
    (globalThis as unknown as { nw: object }).nw = {};
    performance.getEntriesByType ??= () => [];
    globalThis.sentry = Sentry;
    window.stateHooks = {} as typeof window.stateHooks;
    jest.spyOn(browserRuntimeUtils, 'getBrowserName').mockReturnValue('chrome');
    jest
      .mocked(selectors.getNetworkToAutomaticallySwitchTo)
      .mockReturnValue(undefined);
    jest.mocked(metamaskBaseSelectors.getIsUnlocked).mockReturnValue(false);

    const options = getClientOptions();
    Sentry.init({
      ...options,
      integrations: (Array.isArray(options.integrations)
        ? options.integrations
        : []
      ).filter((integration) => integration.name !== 'MetaMetrics'),
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: async (envelope) => {
          envelopes.push(envelope);
          return {};
        },
        flush: async () => true,
      }),
      tracesSampleRate: 1,
      tracesSampler: undefined,
    });
  });

  afterEach(async () => {
    delete globalThis.sentry;
    Reflect.deleteProperty(window, 'stateHooks');
    jest.restoreAllMocks();
    await Sentry.close();
  });

  it('puts every startup tag, `wallet.asset_count` included, on the `UI Startup` segment span', async () => {
    const initialState = { ...defaultMockState.metamask, currentLocale: 'en' };
    const traceContext = trace({ name: TraceName.UIStartup });

    await launchMetamaskUi({
      activeTab: {},
      container: document.createElement('div'),
      backgroundConnection: { startSendingPatches: jest.fn() },
      traceContext,
      initialState,
      onFirstCommit: () => undefined,
    });
    endTrace({ name: TraceName.UIStartup });
    await Sentry.flush();

    const expected = Object.entries(
      getStartupTraceTags({
        metamask: initialState,
      } as unknown as Parameters<typeof getStartupTraceTags>[0]),
    ).filter(([, value]) => value !== undefined);
    const root = sentSpans().find(
      (span) => span.name === TraceName.UIStartup && span.is_segment,
    );

    expect(expected.map(([key]) => key)).toContain('wallet.asset_count');
    expect(root).toBeDefined();
    // Sentry's default data scrubbing drops attribute keys containing "token".
    expect(
      Object.keys(root?.attributes ?? {}).filter((key) => /token/iu.test(key)),
    ).toStrictEqual([]);
    for (const [key, value] of expected) {
      expect(root?.attributes?.[key]?.value).toStrictEqual(value);
    }
  });
});
