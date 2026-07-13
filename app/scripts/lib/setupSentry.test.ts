import { cloneDeep } from 'lodash';

import {
  dropLowValueMarkSpans,
  removeUrlsFromBreadCrumb,
  rewriteReport,
  rewriteTransactionReport,
  shouldCreateSpanForRequest,
} from './setupSentry';

type TestBreadcrumb = ReturnType<typeof removeUrlsFromBreadCrumb> & {
  data?: {
    address?: string;
    arguments?: Array<Error | string | Record<string, unknown>>;
    from?: string;
    logger?: string;
    to?: string;
    url?: string;
  };
  message?: string;
};

type TestReport = Parameters<typeof rewriteReport>[0] & {
  breadcrumbs?: TestBreadcrumb[];
  contexts?: {
    account?: {
      address?: string;
    };
  };
  exception?: {
    values?: Array<{
      value?: string;
    }>;
  };
  extra?: {
    accountAddress?: string;
    appState?: unknown;
    extensionId?: string;
    first?: string[];
    installType?: string;
    nested?: {
      evmAddress?: string;
    };
    second?: string[];
  };
  message?: string;
  request?: {
    url?: string;
  };
  spans?: Array<{
    description?: string;
    name?: string;
    op?: string;
  }>;
  transaction?: string;
  type?: string;
};

describe('Setup Sentry', () => {
  describe('rewriteReport', () => {
    it('should remove urls from error messages', () => {
      const testReport: TestReport = {
        message: 'This report has a test url: http://example.com',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report has a test url: **',
      );
    });

    it('should remove urls from error reports that have an exception with an array of values', () => {
      const testReport: TestReport = {
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
      expect(testReport.exception?.values).toStrictEqual([
        {
          value: 'This report has a test url: **',
        },
        {
          value: '** is another url',
        },
      ]);
    });

    it('should remove ethereum addresses from error messages', () => {
      const testReport: TestReport = {
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
      const testReport: TestReport = {
        message: 'This report has an allowed url: https://codefi.network/',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'This report has an allowed url: https://codefi.network/',
      );
    });

    it('should not remove urls at subdomains of the urls in the allow list', () => {
      const testReport: TestReport = {
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
      const testReport: TestReport = {
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
      const testReport: TestReport = {
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
      const testReport: TestReport = {
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
      const testReport: TestReport = {
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
      const testReport: TestReport = {
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
      const testReport: TestReport = {
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
      const testReport: TestReport = {
        message: 'This is a simple report',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual('This is a simple report');
    });

    it('removes Solana addresses from error messages', () => {
      const testReport: TestReport = {
        message:
          'There is a Solana address 7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs in this message',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'There is a Solana address ** in this message',
      );
    });

    it('removes Tron addresses from error messages', () => {
      const testReport: TestReport = {
        message:
          'There is a Tron address TJRyWwFs9wTFGZg3JbrVriFbNfCug5tDeC in this message',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'There is a Tron address ** in this message',
      );
    });

    it('removes Stellar (XLM) addresses from error messages', () => {
      const testReport: TestReport = {
        message:
          'There is a Stellar address GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX in this message',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'There is a Stellar address ** in this message',
      );
    });

    it('removes Bitcoin bech32 addresses from error messages', () => {
      const testReport: TestReport = {
        message:
          'There is a Bitcoin address bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq in this message',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'There is a Bitcoin address ** in this message',
      );
    });

    it('removes Bitcoin legacy addresses from error messages', () => {
      const testReport: TestReport = {
        message:
          'There is a Bitcoin address 17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem in this message',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'There is a Bitcoin address ** in this message',
      );
    });

    it('removes multiple EVM addresses from a single error message', () => {
      const testReport: TestReport = {
        message:
          'Addresses 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235 and 0x1234567890123456789012345678901234567890 failed',
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.message).toStrictEqual(
        'Addresses 0x** and 0x** failed',
      );
    });

    it('removes addresses from report.extra parameters', () => {
      const testReport: TestReport = {
        message: 'An error occurred',
        extra: {
          accountAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
          nested: {
            evmAddress: '0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
          },
        },
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.extra?.accountAddress).toStrictEqual('**');
      expect(testReport.extra?.nested?.evmAddress).toStrictEqual('0x**');
    });

    it('removes addresses from an array shared across multiple properties', () => {
      const sharedAddresses = ['7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs'];
      const testReport: TestReport = {
        message: 'An error occurred',
        extra: {
          first: sharedAddresses,
          second: sharedAddresses,
        },
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.extra?.first).toStrictEqual(['**']);
      expect(testReport.extra?.second).toStrictEqual(['**']);
    });

    it('removes addresses from report.contexts parameters', () => {
      const testReport: TestReport = {
        message: 'An error occurred',
        contexts: {
          account: {
            address: 'TJRyWwFs9wTFGZg3JbrVriFbNfCug5tDeC',
          },
        },
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.contexts?.account?.address).toStrictEqual('**');
    });

    it('removes addresses from breadcrumbs when sending an error report', () => {
      const testReport: TestReport = {
        message: 'An error occurred',
        breadcrumbs: [
          {
            message: 'console.error',
            data: {
              arguments: [
                new Error(
                  'Failed for 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
                ),
              ],
            },
          },
        ],
        request: {},
      };
      rewriteReport(testReport);
      expect(testReport.breadcrumbs?.[0].data?.arguments?.[0]).toMatchObject({
        message: 'Failed for 0x**',
      });
    });

    it('scrubs breadcrumbs without mutating live source objects', () => {
      const liveError = new Error(
        'Failed for 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
      );
      const liveArgs = [liveError];
      const testReport: TestReport = cloneDeep({
        message: 'An error occurred',
        breadcrumbs: [
          {
            message: 'console.error',
            data: { arguments: liveArgs, logger: 'console' },
          },
        ],
        request: {},
      });

      rewriteReport(testReport);

      expect(testReport.breadcrumbs?.[0].data?.arguments?.[0]).toMatchObject({
        message: 'Failed for 0x**',
      });
      expect(liveError.message).toStrictEqual(
        'Failed for 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
      );
    });
  });

  describe('rewriteTransactionReport', () => {
    it('removes addresses from breadcrumbs when sending a transaction', () => {
      const testReport: TestReport = {
        type: 'transaction',
        transaction: 'ui.popup',
        breadcrumbs: [
          {
            message: 'fetch',
            data: {
              url: 'https://api.example.com/0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
            },
          },
        ],
      };
      rewriteTransactionReport(testReport);
      expect(testReport.breadcrumbs?.[0].data?.url).toStrictEqual('');
    });
  });

  describe('dropLowValueMarkSpans', () => {
    it('drops the listed low-value mark spans, keeping the transaction and other marks/spans', () => {
      const testReport: TestReport = {
        type: 'transaction',
        transaction: 'ui.popup',
        spans: [
          { op: 'mark', description: 'sentry-tracing-init' },
          { op: 'mark', description: 'mm-hero-painted' },
          { op: 'mark', description: 'first-contentful-paint' },
          { op: 'http.client', description: 'GET /foo' },
        ],
      };
      dropLowValueMarkSpans(testReport);
      expect(testReport.transaction).toBe('ui.popup');
      expect(testReport.spans).toStrictEqual([
        { op: 'mark', description: 'first-contentful-paint' },
        { op: 'http.client', description: 'GET /foo' },
      ]);
    });

    it('keeps a non-mark span even if its description matches a low-value mark name', () => {
      const testReport: TestReport = {
        type: 'transaction',
        transaction: 'ui.popup',
        spans: [{ op: 'http.client', description: 'sentry-tracing-init' }],
      };
      dropLowValueMarkSpans(testReport);
      expect(testReport.spans).toStrictEqual([
        { op: 'http.client', description: 'sentry-tracing-init' },
      ]);
    });

    it('leaves a transaction without a low-value mark unchanged', () => {
      const spans = [
        { op: 'mark', description: 'first-contentful-paint' },
        { op: 'http.client', description: 'GET /foo' },
      ];
      const testReport: TestReport = {
        type: 'transaction',
        transaction: 'ui.popup',
        spans,
      };
      dropLowValueMarkSpans(testReport);
      expect(testReport.spans).toStrictEqual(spans);
    });

    it('does not throw when the transaction has no spans array', () => {
      const testReport: TestReport = {
        type: 'transaction',
        transaction: 'ui.popup',
      };
      expect(() => dropLowValueMarkSpans(testReport)).not.toThrow();
      expect(testReport.spans).toBeUndefined();
    });

    it('matches the mark name on the `name` field (SDK v10 forward-compat)', () => {
      const testReport: TestReport = {
        type: 'transaction',
        transaction: 'ui.popup',
        spans: [
          { op: 'mark', name: 'sentry-tracing-init' },
          { op: 'mark', name: 'first-contentful-paint' },
        ],
      };
      dropLowValueMarkSpans(testReport);
      expect(testReport.spans).toStrictEqual([
        { op: 'mark', name: 'first-contentful-paint' },
      ]);
    });
  });

  describe('shouldCreateSpanForRequest', () => {
    it('should return false for snap manifest fetches', () => {
      expect(
        shouldCreateSpanForRequest(
          'chrome-extension://abcdefg/snaps/npm:@metamask/preinstalled-example-snap/snap.manifest.json',
        ),
      ).toStrictEqual(false);
      expect(
        shouldCreateSpanForRequest(
          'moz-extension://abcdefg/snaps/npm:@metamask/message-signing-snap/snap.manifest.json',
        ),
      ).toStrictEqual(false);
    });

    it('should return false for locale file fetches', () => {
      expect(
        shouldCreateSpanForRequest(
          'chrome-extension://abcdefg/_locales/en/messages.json',
        ),
      ).toStrictEqual(false);
      expect(
        shouldCreateSpanForRequest(
          'moz-extension://abcdefg/_locales/es/messages.json',
        ),
      ).toStrictEqual(false);
    });

    it('should return false for root content-hashed json fetches (preinstalled snap bundles)', () => {
      // These are the webpack `asset/resource` preinstalled-snap bundles that
      // sit at the extension root and slipped past the old `/snaps/` regex.
      expect(
        shouldCreateSpanForRequest('chrome-extension://abc/deadbeef.json'),
      ).toStrictEqual(false);
      expect(
        shouldCreateSpanForRequest('moz-extension://abc/deadbeef.json'),
      ).toStrictEqual(false);
    });

    it('should return true for other local extension file fetches (only hashed json is blocked)', () => {
      // Non-hashed local fetches still get spans — the block is scoped to the
      // content-hashed preinstalled-snap bundles, not all local files.
      expect(
        shouldCreateSpanForRequest('chrome-extension://abc/home.html'),
      ).toStrictEqual(true);
      expect(
        shouldCreateSpanForRequest(
          'chrome-extension://abcdefg/scripts/ppom-validator.wasm',
        ),
      ).toStrictEqual(true);
      // A non-hex-named root json (e.g. a config file) is also still traced.
      expect(
        shouldCreateSpanForRequest('chrome-extension://abc/manifest.json'),
      ).toStrictEqual(true);
    });

    it('should return false for sentry.io domains', () => {
      expect(
        shouldCreateSpanForRequest('https://sentry.io/api/123'),
      ).toStrictEqual(false);
      expect(
        shouldCreateSpanForRequest('https://o123.ingest.sentry.io/envelope'),
      ).toStrictEqual(false);
    });

    it('should return false for segment.io domains', () => {
      expect(
        shouldCreateSpanForRequest('https://api.segment.io/v1/batch'),
      ).toStrictEqual(false);
    });

    it('should return false for static config domains', () => {
      expect(
        shouldCreateSpanForRequest('https://chainid.network/chains.json'),
      ).toStrictEqual(false);
      expect(
        shouldCreateSpanForRequest(
          'https://acl.execution.metamask.io/latest/registry.json',
        ),
      ).toStrictEqual(false);
      expect(
        shouldCreateSpanForRequest(
          'https://acl.execution.metamask.io/latest/signature.json',
        ),
      ).toStrictEqual(false);
    });

    it('should return true for external API URLs', () => {
      expect(
        shouldCreateSpanForRequest('https://mainnet.infura.io/v3/abc'),
      ).toStrictEqual(true);
      expect(
        shouldCreateSpanForRequest('https://api.coingecko.com/v3/simple/price'),
      ).toStrictEqual(true);
      expect(
        shouldCreateSpanForRequest('https://example.com/foo'),
      ).toStrictEqual(true);
      // Other cx.metamask.io APIs are real calls — still traced (only the static
      // `acl.execution.metamask.io` config is excluded, not all of metamask.io).
      expect(
        shouldCreateSpanForRequest(
          'https://accounts.api.cx.metamask.io/v2/supportedNetworks',
        ),
      ).toStrictEqual(true);
      expect(
        shouldCreateSpanForRequest('https://token.api.cx.metamask.io/tokens/1'),
      ).toStrictEqual(true);
    });
  });

  describe('removeUrlsFromBreadCrumb', () => {
    it('should hide the breadcrumb data url', () => {
      const testBreadcrumb: TestBreadcrumb = {
        data: {
          url: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data?.url).toStrictEqual('');
    });

    it('should hide the breadcrumb data "to" page', () => {
      const testBreadcrumb: TestBreadcrumb = {
        data: {
          to: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data?.to).toStrictEqual('');
    });

    it('should hide the breadcrumb data "from" page', () => {
      const testBreadcrumb: TestBreadcrumb = {
        data: {
          from: 'https://example.com',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data?.from).toStrictEqual('');
    });

    it('should NOT hide the breadcrumb data url if the url is on the extension protocol', () => {
      const testBreadcrumb: TestBreadcrumb = {
        data: {
          url: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data?.url).toStrictEqual(
        'chrome-extension://abcefg/home.html',
      );
    });

    it('should NOT hide the breadcrumb data "to" page if the url is on the extension protocol', () => {
      const testBreadcrumb: TestBreadcrumb = {
        data: {
          to: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data?.to).toStrictEqual(
        'chrome-extension://abcefg/home.html',
      );
    });

    it('should NOT hide the breadcrumb data "from" page if the url is on the extension protocol', () => {
      const testBreadcrumb: TestBreadcrumb = {
        data: {
          from: 'chrome-extension://abcefg/home.html',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data?.from).toStrictEqual(
        'chrome-extension://abcefg/home.html',
      );
    });

    it('should hide "to" but not "from" or url if "to" is the only one not matching an internal url', () => {
      const testBreadcrumb: TestBreadcrumb = {
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

    it('removes addresses from the breadcrumb message', () => {
      const testBreadcrumb: TestBreadcrumb = {
        message:
          'Selected account 7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
        data: {
          address: '0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.message).toStrictEqual('Selected account **');
    });

    it('removes addresses from the breadcrumb data', () => {
      const testBreadcrumb: TestBreadcrumb = {
        message:
          'Selected account 7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
        data: {
          address: '0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
        },
      };
      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);
      expect(rewrittenBreadcrumb.data?.address).toStrictEqual('0x**');
    });

    it('redacts the breadcrumb data without mutating the live source objects', () => {
      const liveError = new Error(
        'Failed for 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
      );
      const liveArgs = [
        liveError,
        '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      ];
      const testBreadcrumb: TestBreadcrumb = {
        message: 'console.error',
        data: { arguments: liveArgs, logger: 'console' },
      };

      const rewrittenBreadcrumb = removeUrlsFromBreadCrumb(testBreadcrumb);

      // The breadcrumb sent to Sentry is redacted...
      expect(rewrittenBreadcrumb.data?.arguments?.[0]).toMatchObject({
        message: 'Failed for 0x**',
      });
      expect(rewrittenBreadcrumb.data?.arguments?.[1]).toStrictEqual('**');
      // ...but the live Error and array the extension still holds are untouched.
      expect(liveError.message).toStrictEqual(
        'Failed for 0x790A8A9E9bc1C9dB991D8721a92e461Db4CfB235',
      );
      expect(liveArgs[1]).toStrictEqual(
        '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      );
    });
  });
});
