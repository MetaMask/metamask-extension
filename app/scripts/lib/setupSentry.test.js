import * as Sentry from '@sentry/browser';
import {
  removeUrlsFromBreadCrumb,
  rewriteReport,
  makeTransport,
} from './setupSentry';

const defaultMetaMetricsState = {
  participateInMetaMetrics: true,
  metaMetricsId: undefined,
};

describe('Setup Sentry', () => {
  describe('rewriteReport', () => {
    it('sets event.user.id when metaMetricsState has metaMetricsId', () => {
      const event = { message: 'test', request: {} };
      rewriteReport(event, {
        participateInMetaMetrics: true,
        metaMetricsId: 'test-metrics-id',
      });
      expect(event.user).toStrictEqual({ id: 'test-metrics-id' });
    });

    it('does not set event.user when metaMetricsState has no metaMetricsId', () => {
      const event = { message: 'test', request: {} };
      rewriteReport(event, {
        participateInMetaMetrics: true,
        metaMetricsId: undefined,
      });
      expect(event.user).toBeUndefined();
    });

    it('does not set event.user when not opted in', () => {
      const event = { message: 'test', request: {} };
      rewriteReport(event, {
        participateInMetaMetrics: false,
        metaMetricsId: 'ignored',
      });
      expect(event.user).toBeUndefined();
    });

    it('sanitizes urls and addresses', () => {
      const event = {
        message:
          'Error at http://example.com with 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
        request: {},
      };
      rewriteReport(event, defaultMetaMetricsState);
      expect(event.message).toStrictEqual('Error at ** with 0x**');
    });

    it('should remove urls from error messages', () => {
      const testReport = {
        message: 'This report has a test url: http://example.com',
        request: {},
      };
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
      expect(testReport.message).toStrictEqual(
        'There is an ethereum address 0x** in this message',
      );
    });

    it('should not remove urls from our allow list', () => {
      const testReport = {
        message: 'This report has an allowed url: https://codefi.network/',
        request: {},
      };
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
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
      rewriteReport(testReport, defaultMetaMetricsState);
      expect(testReport.message).toStrictEqual(
        'This 0x** address used ** on Saturday',
      );
    });

    it('should not modify an error message with no urls or addresses', () => {
      const testReport = {
        message: 'This is a simple report',
        request: {},
      };
      rewriteReport(testReport, defaultMetaMetricsState);
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
  });
});
