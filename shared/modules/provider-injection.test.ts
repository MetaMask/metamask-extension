import shouldInjectProvider from './provider-injection';

describe('shouldInjectProvider', () => {
  let mockedWindow: jest.SpyInstance;
  let originalDocument: Document;

  function mockUrl(urlString: string) {
    const urlObj = new URL(urlString);

    mockedWindow.mockImplementation(() => ({
      location: {
        hostname: urlObj.hostname,
        origin: urlObj.origin,
        pathname: urlObj.pathname,
      },
      document: {
        doctype: {
          name: 'html',
        },
      },
    }));
  }

  beforeEach(() => {
    mockedWindow = jest.spyOn(window, 'window', 'get');
    originalDocument = global.document;
    global.document = {
      documentElement: {
        nodeName: 'html',
      },
    } as typeof global.document;
  });

  afterEach(() => {
    mockedWindow.mockRestore();
    global.document = originalDocument;
  });

  describe('blockedDomainCheck', () => {
    describe('should prevent injection when', () => {
      it('the domain is blocked', () => {
        mockUrl('https://execution.consensys.io');
        expect(shouldInjectProvider()).toBe(false);
      });

      it('the subdomain of a blocked domain is accessed', () => {
        mockUrl('https://subdomain.execution.consensys.io');
        expect(shouldInjectProvider()).toBe(false);
      });

      it('a blocked href is accessed', () => {
        mockUrl(
          'https://cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
        );
        expect(shouldInjectProvider()).toBe(false);
      });

      it('a blocked href with query params is accessed', () => {
        mockUrl(
          'https://cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html?foo=bar',
        );
        expect(shouldInjectProvider()).toBe(false);
      });

      it('a blocked href with trailing slash is accessed', () => {
        mockUrl(
          'https://cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html/',
        );
        expect(shouldInjectProvider()).toBe(false);
      });

      it('a blocked href with hash is accessed', () => {
        mockUrl(
          'https://cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html#',
        );
        expect(shouldInjectProvider()).toBe(false);
      });
    });

    describe('should allow injection when', () => {
      it('the domain is not blocked', () => {
        mockUrl('https://example.com');
        expect(shouldInjectProvider()).toBe(true);
      });

      it('the href is not blocked', () => {
        mockUrl('https://example.com/some/path');
        expect(shouldInjectProvider()).toBe(true);
      });
    });
  });
});
