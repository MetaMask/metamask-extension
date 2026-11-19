import * as Sentry from '@sentry/browser';
import * as browserRuntimeUtils from '../shared/lib/browser-runtime.utils';
import { endTrace, trace, TraceName } from '../shared/lib/trace';
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
  let envelopes;

  const sentSpans = () =>
    envelopes
      .flatMap(([, items]) => items)
      .filter(([header]) => header.type === 'span')
      .flatMap(([, payload]) => payload.items);

  beforeEach(() => {
    envelopes = [];
    globalThis.nw = {};
    performance.getEntriesByType ??= () => [];
    globalThis.sentry = Sentry;
    window.stateHooks = {};
    jest.spyOn(browserRuntimeUtils, 'getBrowserName').mockReturnValue('chrome');
    selectors.getNetworkToAutomaticallySwitchTo.mockReturnValue(undefined);
    metamaskBaseSelectors.getIsUnlocked.mockReturnValue(false);

    const options = getClientOptions();
    Sentry.init({
      ...options,
      integrations: options.integrations.filter(
        (integration) => integration.name !== 'MetaMetrics',
      ),
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
    delete window.stateHooks;
    jest.restoreAllMocks();
    await Sentry.close();
  });

  it('puts every startup tag, `wallet.token_count` included, on the `UI Startup` segment span', async () => {
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
      getStartupTraceTags({ metamask: initialState }),
    ).filter(([, value]) => value !== undefined);
    const root = sentSpans().find(
      (span) => span.name === TraceName.UIStartup && span.is_segment,
    );

    expect(expected.map(([key]) => key)).toContain('wallet.token_count');
    expect(root).toBeDefined();
    for (const [key, value] of expected) {
      expect(root.attributes[key]?.value).toStrictEqual(value);
    }
  });
});
