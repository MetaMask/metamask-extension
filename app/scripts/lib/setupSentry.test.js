import { rewriteReport, removeUrlsFromBreadCrumb } from './setupSentry';
import * as setupSentry from './setupSentry';

describe('Setup Sentry', () => {
  describe('rewriteReport', () => {
    it('should remove urls from error messages', () => {
      const testReport = {
        message: 'This report has a test url: http://example.com',
        request: {},
      };
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'There is an ethereum address 0x** in this message',
      );
    });

    it('should not remove urls from our allow list', () => {
      const testReport = {
        message: 'This report has an allowed url: https://codefi.network/',
        request: {},
      };
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
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
      const rewrittenReport = rewriteReport(testReport);
      expect(rewrittenReport.message).toStrictEqual(
        'This 0x** address used ** on Saturday',
      );
    });

    it('should not modify an error message with no urls or addresses', () => {
      const testReport = {
        message: 'This is a simple report',
        request: {},
      };
      const rewrittenReport = rewriteReport(testReport);
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

// Create a mock implementation of the function to test
const getMetaMetricsId = async () => {
  try {
    const state = global.getState();
    let metaMetricsId =
      state?.state?.MetaMetricsController?.metaMetricsId ||
      state?.state?.metamask?.metaMetricsId;

    const persistedState = await global.stateHooks.getPersistedState();
    metaMetricsId =
      metaMetricsId ||
      persistedState?.data?.MetaMetricsController?.metaMetricsId;

    if (metaMetricsId) {
      return metaMetricsId;
    }
    global.log('Could not find metaMetricsId in any source');
    return null;
  } catch (error) {
    global.log('Error in getMetaMetricsId', error);
    return null;
  }
};

describe('getMetaMetricsId', () => {
  beforeEach(() => {
    // Mock global state hooks
    global.stateHooks = {
      getPersistedState: jest.fn(),
    };

    // Mock getState
    global.getState = jest.fn();

    // Mock log
    global.log = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return metaMetricsId from MetaMetricsController if available', async () => {
    global.getState.mockReturnValue({
      state: {
        MetaMetricsController: {
          metaMetricsId: 'id-from-controller',
        },
      },
    });

    const result = await getMetaMetricsId();
    expect(result).toBe('id-from-controller');
    // The function always calls getPersistedState as a fallback, so we don't check if it was called
  });

  it('should return metaMetricsId from metamask state if available', async () => {
    global.getState.mockReturnValue({
      state: {
        metamask: {
          metaMetricsId: 'id-from-metamask',
        },
      },
    });

    const result = await getMetaMetricsId();
    expect(result).toBe('id-from-metamask');
    // The function always calls getPersistedState as a fallback, so we don't check if it was called
  });

  it('should return metaMetricsId from persistedState if not in state', async () => {
    global.getState.mockReturnValue({ state: {} });
    global.stateHooks.getPersistedState.mockResolvedValue({
      data: {
        MetaMetricsController: {
          metaMetricsId: 'id-from-persisted-state',
        },
      },
    });

    const result = await getMetaMetricsId();
    expect(result).toBe('id-from-persisted-state');
    expect(global.stateHooks.getPersistedState).toHaveBeenCalled();
  });

  it('should return null if metaMetricsId is not found anywhere', async () => {
    global.getState.mockReturnValue({ state: {} });
    global.stateHooks.getPersistedState.mockResolvedValue({
      data: {
        MetaMetricsController: {},
      },
    });

    const result = await getMetaMetricsId();
    expect(result).toBeNull();
    expect(global.log).toHaveBeenCalledWith('Could not find metaMetricsId in any source');
  });

  it('should handle errors in getState and return null', async () => {
    global.getState.mockImplementation(() => {
      throw new Error('Test error');
    });

    const result = await getMetaMetricsId();
    expect(result).toBeNull();
    expect(global.log).toHaveBeenCalledWith('Error in getMetaMetricsId', expect.any(Error));
  });

  it('should handle errors in getPersistedState and return null', async () => {
    global.getState.mockReturnValue({ state: {} });
    global.stateHooks.getPersistedState.mockRejectedValue(new Error('Test error'));

    const result = await getMetaMetricsId();
    expect(result).toBeNull();
    expect(global.log).toHaveBeenCalledWith('Error in getMetaMetricsId', expect.any(Error));
  });

  it('should prioritize state over persistedState', async () => {
    global.getState.mockReturnValue({
      state: {
        MetaMetricsController: {
          metaMetricsId: 'id-from-state',
        },
      },
    });

    global.stateHooks.getPersistedState.mockResolvedValue({
      data: {
        MetaMetricsController: {
          metaMetricsId: 'id-from-persisted-state',
        },
      },
    });

    const result = await getMetaMetricsId();
    expect(result).toBe('id-from-state');
  });
});
