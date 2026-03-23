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
});
