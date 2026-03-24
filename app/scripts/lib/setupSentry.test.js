import * as Sentry from '@sentry/browser';
import { forEachEnvelopeItem, parseEnvelope } from '@sentry/utils';
import {
  removeUrlsFromBreadCrumb,
  rewriteReport,
  getMetaMetricsStateFromAppState,
  getMetaMetricsStateFromPersistedState,
  getMetaMetricsStateFromBackupState,
} from './setupSentry';

describe('Setup Sentry', () => {
  describe('getMetaMetricsStateFromAppState', () => {
    it('returns null when appState has no state or persistedState', () => {
      expect(getMetaMetricsStateFromAppState({})).toBeNull();
    });

    it('delegates to getMetaMetricsStateFromPersistedState when persistedState is present', () => {
      const persistedState = {
        data: {
          MetaMetricsController: {
            participateInMetaMetrics: true,
            metaMetricsId: 'persisted-id',
          },
        },
      };
      expect(getMetaMetricsStateFromAppState({ persistedState })).toStrictEqual(
        {
          participateInMetaMetrics: true,
          metaMetricsId: 'persisted-id',
        },
      );
    });

    it('returns state from appState.state.metamask when present', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            metamask: {
              participateInMetaMetrics: true,
              metaMetricsId: 'metamask-id',
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'metamask-id',
      });
    });

    it('returns state from appState.state.MetaMetricsController when state has no metamask', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'controller-id',
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'controller-id',
      });
    });

    it('returns participateInMetaMetrics false and no metaMetricsId when not opted in', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
    });
  });

  describe('getMetaMetricsStateFromPersistedState', () => {
    it('returns participateInMetaMetrics and metaMetricsId when opted in', () => {
      expect(
        getMetaMetricsStateFromPersistedState({
          data: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'id-123',
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'id-123',
      });
    });

    it('returns participateInMetaMetrics false and no metaMetricsId when not opted in', () => {
      expect(
        getMetaMetricsStateFromPersistedState({
          data: {
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
    });

    it('handles missing or malformed persisted state', () => {
      expect(getMetaMetricsStateFromPersistedState(undefined)).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
      expect(getMetaMetricsStateFromPersistedState({ data: {} })).toStrictEqual(
        {
          participateInMetaMetrics: false,
          metaMetricsId: undefined,
        },
      );
    });
  });

  describe('getMetaMetricsStateFromBackupState', () => {
    it('returns participateInMetaMetrics and metaMetricsId when opted in', () => {
      expect(
        getMetaMetricsStateFromBackupState({
          MetaMetricsController: {
            participateInMetaMetrics: true,
            metaMetricsId: 'backup-id',
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'backup-id',
      });
    });

    it('returns participateInMetaMetrics false when not opted in', () => {
      expect(
        getMetaMetricsStateFromBackupState({
          MetaMetricsController: { participateInMetaMetrics: false },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
    });

    it('handles missing or malformed backup state', () => {
      expect(getMetaMetricsStateFromBackupState(undefined)).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
      expect(getMetaMetricsStateFromBackupState({})).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
    });
  });

  describe('rewriteReport', () => {
    afterEach(() => {
      delete globalThis.stateHooks?.getSentryState;
    });

    it('sets report.user.id from UI snapshot when opted in', () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({
          state: {
            metamask: {
              participateInMetaMetrics: true,
              metaMetricsId: 'test-metrics-id',
            },
          },
        }),
      };
      const rewritten = rewriteReport({ message: 'test', request: {} });
      expect(rewritten.user).toStrictEqual({ id: 'test-metrics-id' });
    });

    it('does not set report.user when opted in but metaMetricsId is missing', () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({
          state: {
            metamask: {
              participateInMetaMetrics: true,
              metaMetricsId: undefined,
            },
          },
        }),
      };
      const rewritten = rewriteReport({ message: 'test', request: {} });
      expect(rewritten.user).toBeUndefined();
    });

    it('does not set report.user when not opted in', () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: false,
              metaMetricsId: 'ignored',
            },
          },
        }),
      };
      const rewritten = rewriteReport({ message: 'test', request: {} });
      expect(rewritten.user).toBeUndefined();
    });

    it('sanitizes urls and addresses and sets user id when snapshot has id', () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'test-metrics-id',
            },
          },
        }),
      };
      const event = {
        message:
          'Error at http://example.com with 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
        request: {},
      };
      rewriteReport(event);
      expect(event.message).toStrictEqual('Error at ** with 0x**');
      expect(event.user).toStrictEqual({ id: 'test-metrics-id' });
    });

    it('should remove urls from error messages', () => {
      const testReport = {
        message: 'This report has a test url: http://example.com',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report has a test url: **',
      );
    });

    it('should remove urls from error reports that have an exception with an array of values', () => {
      const testReport = {
        exception: {
          values: [
            {
              value: 'This report has a test url: http://example.com',
            },
            {
              value: 'https://example.com is another url',
            },
          ],
        },
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.exception.values).toStrictEqual([
        {
          value: 'This report has a test url: **',
        },
        {
          value: '** is another url',
        },
      ]);
    });

    it('should remove ethereum addresses from error messages', () => {
      const testReport = {
        message:
          'There is an ethereum address 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235 in this message',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'There is an ethereum address 0x** in this message',
      );
    });

    it('should not remove urls from our allow list', () => {
      const testReport = {
        message: 'This report has an allowed url: https://codefi.network/',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report has an allowed url: https://codefi.network/',
      );
    });

    it('should not remove urls at subdomains of the urls in the allow list', () => {
      const testReport = {
        message:
          'This report has an allowed url: https://subdomain.codefi.network/',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report has an allowed url: https://subdomain.codefi.network/',
      );
    });

    it('should remove urls very similar to, but different from, those in our allow list', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://nodefi.network/',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls with allow list urls in their domain path', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://codefi.network.another.domain.com/',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls have allowed urls in their URL path', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://example.com/test?redirect=http://codefi.network',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls with subdomains', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://subdomain.example.com/',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove invalid urls', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://example.%%%/',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls and ethereum addresses from error messages', () => {
      const testReport = {
        message:
          'This 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235 address used http://example.com on Saturday',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This 0x** address used ** on Saturday',
      );
    });

    it('should not modify an error message with no urls or addresses', () => {
      const testReport = {
        message: 'This is a simple report',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual('This is a simple report');
    });
  });

  describe('removeUrlsFromBreadCrumb', () => {
    it('should hide the breadcrumb data url', () => {
      const testBreadcrumb = {
        data: {
          url: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.url).toStrictEqual('');
    });

    it('should hide the breadcrumb data "to" page', () => {
      const testBreadcrumb = {
        data: {
          to: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.to).toStrictEqual('');
    });

    it('should hide the breadcrumb data "from" page', () => {
      const testBreadcrumb = {
        data: {
          from: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.from).toStrictEqual('');
    });

    it('should NOT hide the breadcrumb data url if the url is on the extension protocol', () => {
      const testBreadcrumb = {
        data: {
          url: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.url).toStrictEqual(
        'chrome-extension://abcefg/home.html',
      );
    });

    it('should NOT hide the breadcrumb data "to" page if the url is on the extension protocol', () => {
      const testBreadcrumb = {
        data: {
          to: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.to).toStrictEqual(
        'chrome-extension://abcefg/home.html',
      );
    });

    it('should NOT hide the breadcrumb data "from" page if the url is on the extension protocol', () => {
      const testBreadcrumb = {
        data: {
          from: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.from).toStrictEqual(
        'chrome-extension://abcefg/home.html',
      );
    });

    it('should hide "to" but not "from" or url if "to" is the only one not matching an internal url', () => {
      const testBreadcrumb = {
        data: {
          url: 'chrome-extension://abcefg/home.html',
          to: 'https://example.com',
          from: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data).toStrictEqual({
        url: 'chrome-extension://abcefg/home.html',
        to: '',
        from: 'chrome-extension://abcefg/home.html',
      });
    });
  });

  describe('makeTransport (construction)', () => {
    it('does not call fetch when makeTransport is called', () => {
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({ ok: true });

      makeTransport({});

      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('does not call send or flush on the default transport when makeTransport is called', () => {
      const defaultTransportSend = jest.fn().mockResolvedValue({});
      const defaultTransportFlush = jest.fn().mockResolvedValue(true);
      const makeFetchTransportSpy = jest
        .spyOn(Sentry, 'makeFetchTransport')
        .mockReturnValue({
          send: defaultTransportSend,
          flush: defaultTransportFlush,
        });

      makeTransport({});

      expect(defaultTransportSend).not.toHaveBeenCalled();
      expect(defaultTransportFlush).not.toHaveBeenCalled();

      makeFetchTransportSpy.mockRestore();
    });
  });

  describe('makeTransport', () => {
    let makeFetchTransportSpy;

    beforeEach(() => {
      makeFetchTransportSpy = jest.spyOn(Sentry, 'makeFetchTransport');
      makeFetchTransportSpy.mockReturnValue({
        send: jest.fn().mockResolvedValue({}),
        flush: jest.fn().mockResolvedValue(true),
      });
    });

    afterEach(() => {
      makeFetchTransportSpy.mockRestore();
      delete globalThis.stateHooks?.getPersistedState;
      delete globalThis.stateHooks?.getBackupState;
    });

    it('throws when MetaMetrics is not opted in', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
        getBackupState: async () => ({}),
      };

      const transport = makeTransport({});
      const envelope = [{}, [[{ type: 'event' }, { message: 'test' }]]];

      await expect(transport.send(envelope)).rejects.toThrow(
        'Network request skipped as metrics disabled',
      );
      expect(makeFetchTransportSpy).toHaveBeenCalled();
      expect(
        makeFetchTransportSpy.mock.results[0].value.send,
      ).not.toHaveBeenCalled();
    });

    it('calls default transport send and mutates event when opted in', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'transport-test-id',
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      const transport = makeTransport({});
      const eventPayload = { message: 'test event' };
      const envelope = [{}, [[{ type: 'event' }, eventPayload]]];

      await transport.send(envelope);

      expect(eventPayload.user).toStrictEqual({ id: 'transport-test-id' });
      const defaultTransport = makeFetchTransportSpy.mock.results[0].value;
      expect(defaultTransport.send).toHaveBeenCalledTimes(1);
      expect(defaultTransport.send).toHaveBeenCalledWith(envelope);
    });

    it('uses app state from getSentryState when available', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'app-state-id',
            },
          },
        }),
        getPersistedState: async () => ({}),
        getBackupState: async () => ({}),
      };

      const transport = makeTransport({});
      const eventPayload = { message: 'test' };
      const envelope = [{}, [[{ type: 'event' }, eventPayload]]];

      await transport.send(envelope);

      expect(eventPayload.user).toStrictEqual({ id: 'app-state-id' });
      expect(
        makeFetchTransportSpy.mock.results[0].value.send,
      ).toHaveBeenCalledWith(envelope);
    });

    it('falls back to backup state when getPersistedState throws', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => ({
          MetaMetricsController: {
            participateInMetaMetrics: true,
            metaMetricsId: 'backup-id',
          },
        }),
      };

      const transport = makeTransport({});
      const eventPayload = { message: 'test' };
      const envelope = [{}, [[{ type: 'event' }, eventPayload]]];

      await transport.send(envelope);

      expect(eventPayload.user).toStrictEqual({ id: 'backup-id' });
      expect(
        makeFetchTransportSpy.mock.results[0].value.send,
      ).toHaveBeenCalledWith(envelope);
    });

    it('throws when both getPersistedState and getBackupState fail', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: async () => {
          throw new Error('persisted failed');
        },
        getBackupState: async () => {
          throw new Error('backup failed');
        },
      };

      const transport = makeTransport({});
      const envelope = [{}, [[{ type: 'event' }, { message: 'test' }]]];

      await expect(transport.send(envelope)).rejects.toThrow(
        'Network request skipped as metrics disabled',
      );
      expect(
        makeFetchTransportSpy.mock.results[0].value.send,
      ).not.toHaveBeenCalled();
    });
  });

  describe('Sentry.init with makeTransport (MetaMetrics)', () => {
    /**
     * Sentry starts or updates sessions on a later turn of the event loop, not inline with
     * `init`. `setTimeout(0)` schedules the next macrotask so that deferred session work, and
     * any related `fetch`, can run before we assert.
     */
    function triggerSessionEvent() {
      return new Promise((resolve) => {
        // Clear the microtask queue and/or wait for the next event loop
        setTimeout(resolve, 0);
      });
    }

    afterEach(async () => {
      await Sentry.close(2000);
      delete globalThis.stateHooks?.getPersistedState;
      delete globalThis.stateHooks?.getBackupState;
      delete globalThis.stateHooks?.getSentryState;
    });

    it('does not call fetch after init when opted out (after triggerSessionEvent)', async () => {
      globalThis.nw = {};
      globalThis.history ??= {};

      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
        getBackupState: async () => ({}),
      };

      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({ ok: true });

      await Sentry.close(2000);
      Sentry.init({
        dsn: 'https://public@fake.ingest.sentry.io/1',
        release: 'setup-sentry-unit-test',
        transport: makeTransport,
        tracesSampleRate: 0,
      });

      await triggerSessionEvent();

      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('calls fetch after init when opted in (after triggerSessionEvent)', async () => {
      globalThis.nw = {};
      globalThis.history ??= {};

      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'init-session-test-id',
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({ ok: true });

      await Sentry.close(2000);
      Sentry.init({
        dsn: 'https://public@fake.ingest.sentry.io/1',
        release: 'setup-sentry-unit-test',
        transport: makeTransport,
        tracesSampleRate: 0,
      });

      await triggerSessionEvent();

      expect(fetchSpy).toHaveBeenCalled();

      const envelopes = fetchSpy.mock.calls
        .map(([, init]) => init?.body)
        .filter(Boolean)
        .map((body) => {
          try {
            return parseEnvelope(body);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const hasSessionItem = envelopes.some((envelope) =>
        forEachEnvelopeItem(envelope, (_item, type) => type === 'session'),
      );
      expect(hasSessionItem).toBe(true);

      fetchSpy.mockRestore();
    });
  });
});
