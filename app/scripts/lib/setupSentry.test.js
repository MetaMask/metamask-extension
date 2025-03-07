import * as Sentry from '@sentry/browser';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import * as setupSentry from './setupSentry';

// Mock the entire setupSentry module because it is a readonly module
jest.mock('./setupSentry', () => {
  const originalModule = jest.requireActual('./setupSentry');
  return {
    ...originalModule,
    sentryUserId: null,
    log: jest.fn(),
    setUserIdIfAvailable: jest.fn(),
  };
});
jest.mock('@sentry/browser', () => ({
  setUser: jest.fn(),
}));

describe('Setup Sentry', () => {
  describe('rewriteReport', () => {
    it('should remove urls from error messages', () => {
      const testReport = {
        message: 'This report has a test url: http://example.com',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
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
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.exception.values).toStrictEqual([
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
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'There is an ethereum address 0x** in this message',
      );
    });

    it('should not remove urls from our allow list', () => {
      const testReport = {
        message: 'This report has an allowed url: https://codefi.network/',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report has an allowed url: https://codefi.network/',
      );
    });

    it('should not remove urls at subdomains of the urls in the allow list', () => {
      const testReport = {
        message:
          'This report has an allowed url: https://subdomain.codefi.network/',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report has an allowed url: https://subdomain.codefi.network/',
      );
    });

    it('should remove urls very similar to, but different from, those in our allow list', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://nodefi.network/',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls with allow list urls in their domain path', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://codefi.network.another.domain.com/',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls have allowed urls in their URL path', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://example.com/test?redirect=http://codefi.network',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls with subdomains', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://subdomain.example.com/',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove invalid urls', () => {
      const testReport = {
        message:
          'This report does not have an allowed url: https://example.%%%/',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This report does not have an allowed url: **',
      );
    });

    it('should remove urls and ethereum addresses from error messages', () => {
      const testReport = {
        message:
          'This 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235 address used http://example.com on Saturday',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This 0x** address used ** on Saturday',
      );
    });

    it('should not modify an error message with no urls or addresses', () => {
      const testReport = {
        message: 'This is a simple report',
        request: {},
      };
      const rewrittenReport = setupSentry.rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual('This is a simple report');
    });
  });

  describe('removeUrlsFromBreadCrumb', () => {
    it('should hide the breadcrumb data url', () => {
      const testBreadcrumb = {
        data: {
          url: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb =
        setupSentry.removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.url).toStrictEqual('');
    });

    it('should hide the breadcrumb data "to" page', () => {
      const testBreadcrumb = {
        data: {
          to: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb =
        setupSentry.removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.to).toStrictEqual('');
    });

    it('should hide the breadcrumb data "from" page', () => {
      const testBreadcrumb = {
        data: {
          from: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb =
        setupSentry.removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data.from).toStrictEqual('');
    });

    it('should NOT hide the breadcrumb data url if the url is on the extension protocol', () => {
      const testBreadcrumb = {
        data: {
          url: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb =
        setupSentry.removeUrlsFromBreadCrumb(testBreadcrumb);
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
      const rewrittenBreadcrumb =
        setupSentry.removeUrlsFromBreadCrumb(testBreadcrumb);
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
      const rewrittenBreadcrumb =
        setupSentry.removeUrlsFromBreadCrumb(testBreadcrumb);
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
      const rewrittenBreadcrumb =
        setupSentry.removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data).toStrictEqual({
        url: 'chrome-extension://abcefg/home.html',
        to: '',
        from: 'chrome-extension://abcefg/home.html',
      });
    });
  });

  describe('setUserIdIfAvailable', () => {
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();

      // Restore the original implementation for the test
      setupSentry.setUserIdIfAvailable.mockImplementation(
        jest.requireActual('./setupSentry').setUserIdIfAvailable,
      );
    });

    it('should set user ID with a UUID v4 when called', () => {
      setupSentry.setUserIdIfAvailable();
      expect(Sentry.setUser).toHaveBeenCalledTimes(1);
      const userId = Sentry.setUser.mock.calls[0][0].id;
      expect(uuidValidate(userId)).toBe(true);
      expect(uuidVersion(userId)).toBe(4);
    });

    it('should reuse the same UUID when called multiple times', () => {
      // Call the function twice
      setupSentry.setUserIdIfAvailable();
      setupSentry.setUserIdIfAvailable();

      // Should call setUser twice
      expect(Sentry.setUser).toHaveBeenCalledTimes(2);

      // Both calls should use the same UUID
      const firstCallId = Sentry.setUser.mock.calls[0][0].id;
      const secondCallId = Sentry.setUser.mock.calls[1][0].id;
      expect(firstCallId).toStrictEqual(secondCallId);
    });
  });
});
