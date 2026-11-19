import {
  isPhishingWarningPageUrl,
  loadPhishingWarningPage,
  PhishingWarningPageTimeoutError,
  PHISHING_WARNING_PAGE_TIMEOUT,
  phishingPageHref,
} from './phishing-warning-page';

process.env.PHISHING_WARNING_PAGE_URL =
  'https://metamask.github.io/phishing-warning/v4.1.0/';

describe('phishing warning page helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('matches warning page URLs by origin and pathname', () => {
    expect(
      isPhishingWarningPageUrl(
        new URL('https://metamask.github.io/phishing-warning/v4.1.0/'),
      ),
    ).toBe(true);
    expect(
      isPhishingWarningPageUrl(
        new URL('https://example.com/phishing-warning/'),
      ),
    ).toBe(false);
  });

  it('loads the warning page iframe and removes it after load', async () => {
    const iframe = {
      setAttribute: jest.fn(),
      addEventListener: jest.fn((event, handler) => {
        if (event === 'load') {
          handler();
        }
      }),
      remove: jest.fn(),
    };
    const documentRoot = {
      createElement: jest.fn().mockReturnValue(iframe),
      body: {
        appendChild: jest.fn(),
      },
    } as unknown as Document;

    await loadPhishingWarningPage(documentRoot);

    expect(documentRoot.createElement).toHaveBeenCalledWith('iframe');
    expect(iframe.setAttribute).toHaveBeenCalledWith(
      'src',
      `${phishingPageHref}#extensionStartup`,
    );
    expect(documentRoot.body.appendChild).toHaveBeenCalledWith(iframe);
    expect(iframe.remove).toHaveBeenCalled();
  });

  it('warns and removes the iframe when loading times out', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const iframe = {
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      remove: jest.fn(),
    };
    const documentRoot = {
      createElement: jest.fn().mockReturnValue(iframe),
      body: {
        appendChild: jest.fn(),
      },
    } as unknown as Document;

    const loadPromise = loadPhishingWarningPage(documentRoot);
    jest.advanceTimersByTime(PHISHING_WARNING_PAGE_TIMEOUT);
    await loadPromise;

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Phishing warning page timeout; page not guaranteed to work offline.',
    );
    expect(iframe.remove).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('uses PhishingWarningPageTimeoutError for timeout failures', () => {
    expect(new PhishingWarningPageTimeoutError()).toBeInstanceOf(Error);
    expect(new PhishingWarningPageTimeoutError().message).toBe(
      'Timeout failed',
    );
  });
});
