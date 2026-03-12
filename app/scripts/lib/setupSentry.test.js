import { rewriteReport, removeUrlsFromBreadCrumb } from './setupSentry';

describe('Setup Sentry', () => {
  describe('rewriteReport', () => {
    it('removes urls from error messages', async () => {
      const testReport = {
        message: 'This report has a test url: http://example.com',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report has a test url: **',
      );
    });

    it('removes urls from error reports that have an exception with an array of values', async () => {
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
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.exception.values).toStrictEqual([
        {
          value: 'This report has a test url: **',
        },
        {
          value: '** is another url',
        },
      ]);
    });

    it('removes ethereum addresses from error messages', async () => {
      const testReport = {
        message:
          'There is an ethereum address 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235 in this message',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'There is an ethereum address 0x** in this message',
      );
    });

    it('does not remove urls from our allow list', async () => {
      const testReport = {
        message: 'This report has an allowed url: https://codefi.network/',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report has an allowed url: https://codefi.network/',
      );
    });

    it('does not remove urls at subdomains of the urls in the allow list', async () => {
      const testReport = {
        message:
          'This report has an allowed url: https://subdomain.codefi.network/',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report has an allowed url: https://subdomain.codefi.network/',
      );
    });

    it('removes urls very similar to, but different from, those in our allow list', async () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://nodefi.network/',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('removes urls with allow list urls in their domain path', async () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://codefi.network.another.domain.com/',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('removes urls that have allowed urls in their URL path', async () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://example.com/test?redirect=http://codefi.network',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('removes urls with subdomains', async () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://subdomain.example.com/',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('removes invalid urls', async () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://example.%%%/',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('removes urls and ethereum addresses from error messages', async () => {
      const testReport = {
        message:
          'This 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235 address used http://example.com on Saturday',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This 0x** address used ** on Saturday',
      );
    });

    it('does not modify an error message with no urls or addresses', async () => {
      const testReport = {
        message: 'This is a simple report',
        request: {},
      };
      const rewrittenReport = await rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual('This is a simple report');
    });
  });

  describe('MetaMetrics state and report.user', () => {
    let originalStateHooks;

    beforeEach(() => {
      originalStateHooks = globalThis.stateHooks;
    });

    afterEach(() => {
      globalThis.stateHooks = originalStateHooks;
    });

    it('sets report.user.id from MetaMetrics state when user has opted in (background state)', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'test-metrics-id-123',
            },
          },
        }),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toStrictEqual({
        id: 'test-metrics-id-123',
      });
    });

    it('sets report.user.id from MetaMetrics state when user has opted in (UI state)', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({
          state: {
            metamask: {
              participateInMetaMetrics: true,
              metaMetricsId: 'ui-metrics-id',
            },
          },
        }),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toStrictEqual({ id: 'ui-metrics-id' });
    });

    it('does not set report.user when user has not opted in', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: false,
              metaMetricsId: 'some-id',
            },
          },
        }),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toBeUndefined();
    });

    it('does not set report.user when MetaMetrics state is missing', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({ state: {} }),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toBeUndefined();
    });

    it('does not set report.user when app state is empty', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toBeUndefined();
    });

    it('sets report.user.id from persisted state when app state is empty', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: () =>
          Promise.resolve({
            data: {
              MetaMetricsController: {
                participateInMetaMetrics: true,
                metaMetricsId: 'persisted-metrics-id',
              },
            },
          }),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toStrictEqual({
        id: 'persisted-metrics-id',
      });
    });

    it('sets report.user.id from backup state when persisted state fails', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: () => Promise.reject(new Error('storage failed')),
        getBackupState: () =>
          Promise.resolve({
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'backup-metrics-id',
            },
          }),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toStrictEqual({
        id: 'backup-metrics-id',
      });
    });

    it('does not set report.user when both persisted state and backup state fail', async () => {
      globalThis.stateHooks = {
        getSentryState: () => ({}),
        getPersistedState: () => Promise.reject(new Error('storage failed')),
        getBackupState: () => Promise.reject(new Error('backup failed')),
      };

      const testReport = { message: 'test', request: {} };
      const rewrittenReport = await rewriteReport(testReport);

      expect(rewrittenReport.user).toBeUndefined();
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
