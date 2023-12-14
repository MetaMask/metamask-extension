import shouldInjectProvider from './provider-injection';

let windowSpy;
let docBefore;

describe('test provider injection check', () => {
  function mockUrl(url) {
    windowSpy.mockImplementation(() => ({
      location: {
        origin: url,
        pathname: '/',
        href: url,
      },
      document: {
        doctype: {
          name: 'html',
        },
      },
    }));
  }
  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');
    docBefore = global.document;
    global.document = {
      documentElement: {
        nodeName: 'html',
      },
    };
  });

  afterEach(() => {
    windowSpy.mockRestore();
    global.document = docBefore;
  });

  it('should allow https://example.com', () => {
    mockUrl('https://example.com');

    const shouldInject = shouldInjectProvider();
    expect(shouldInject).toBeTruthy();
  });

  it('should block https://www.uscourts.gov', () => {
    mockUrl('https://www.uscourts.gov');

    const shouldInject = shouldInjectProvider();
    expect(shouldInject).toBeFalsy();
  });

  it('should allow file:///C:/file.html', () => {
    mockUrl('file:///C:/file.html');

    const shouldInject = shouldInjectProvider();
    expect(shouldInject).toBeTruthy();
  });

  it('should block file://C:/file.html', () => {
    mockUrl('file://C:/file.html');

    const shouldInject = shouldInjectProvider();
    expect(shouldInject).toBeFalsy();
  });
});
