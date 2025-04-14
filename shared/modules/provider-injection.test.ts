import shouldInjectProvider from './provider-injection';

describe('shouldInjectProvider', () => {
  let mockedWindow: jest.SpyInstance;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  let originalDocument: Document;

  function mockUrl(urlString: string) {
    const urlObj = new URL(urlString);

    mockedWindow.mockImplementation(() => ({
      location: urlObj,
      document: {
        doctype: {
          name: 'html',
        },
      },
    }));
  }

  beforeEach(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    mockedWindow = jest.spyOn(window, 'window', 'get');
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    originalDocument = global.document;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.document = {
      documentElement: {
        nodeName: 'html',
      },
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    } as typeof global.document;
  });

  afterEach(() => {
    mockedWindow.mockRestore();
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
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
