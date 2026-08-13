import browser from 'webextension-polyfill';
import {
  bindHostColorScheme,
  injectPageStyles,
  loadCss,
  removePageStyles,
  scopeDesignTokensForShadow,
} from './ui';

describe('loadCss', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    Object.assign(browser.runtime, {
      getURL: (path: string) => `chrome-extension://test/${path}`,
    });
    globalThis.fetch = fetchMock as typeof fetch;
    fetchMock.mockReset();
  });

  it('returns CSS text when the fetch succeeds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => '.foo{color:red}',
    });

    await expect(loadCss('scripts/cashtag/widget/page.css')).resolves.toBe(
      '.foo{color:red}',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'chrome-extension://test/scripts/cashtag/widget/page.css',
    );
  });

  it('returns an empty string when the response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => 'missing',
    });

    await expect(loadCss('missing.css')).resolves.toBe('');
  });

  it('returns an empty string when fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('network'));

    await expect(loadCss('broken.css')).resolves.toBe('');
  });
});

describe('scopeDesignTokensForShadow', () => {
  it('returns an empty string for empty input', () => {
    expect(scopeDesignTokensForShadow('')).toBe('');
  });

  it('rewrites theme blocks and remaining :root to :host', () => {
    const input =
      ':root{--brand:1}.light,:root,[data-theme=light]{--color:light}.dark,[data-theme=dark]{--color:dark}:root{--type:1}';

    expect(scopeDesignTokensForShadow(input)).toBe(
      ':host{--brand:1}:host([data-theme=light]){--color:light}:host([data-theme=dark]){--color:dark}:host{--type:1}',
    );
  });
});

describe('bindHostColorScheme', () => {
  let listeners: ((event: MediaQueryListEvent) => void)[];
  let matches: boolean;

  beforeEach(() => {
    listeners = [];
    matches = false;
    jest.spyOn(window, 'matchMedia').mockImplementation(() => {
      return {
        get matches() {
          return matches;
        },
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.push(listener);
        },
        removeEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners = listeners.filter((entry) => entry !== listener);
        },
        dispatchEvent: jest.fn(),
      } as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets data-theme from the current color scheme', () => {
    matches = true;
    const host = document.createElement('div');

    const unbind = bindHostColorScheme(host);

    expect(host.getAttribute('data-theme')).toBe('dark');
    unbind();
  });

  it('updates data-theme when the color scheme changes', () => {
    const host = document.createElement('div');
    const unbind = bindHostColorScheme(host);

    expect(host.getAttribute('data-theme')).toBe('light');

    matches = true;
    listeners.forEach((listener) =>
      listener({ matches: true } as MediaQueryListEvent),
    );

    expect(host.getAttribute('data-theme')).toBe('dark');
    unbind();
    expect(listeners).toHaveLength(0);
  });
});

describe('injectPageStyles', () => {
  const fetchMock = jest.fn();
  const markerAttr = 'data-mm-cashtag-test-css';

  beforeEach(() => {
    Object.assign(browser.runtime, {
      getURL: (path: string) => `chrome-extension://test/${path}`,
    });
    globalThis.fetch = fetchMock as typeof fetch;
    fetchMock.mockReset();
    document
      .querySelectorAll(`style[${markerAttr}]`)
      .forEach((node) => node.remove());
  });

  it('injects a style tag once for the marker', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => '.pill{display:inline}',
    });

    await injectPageStyles('scripts/cashtag/pill/page.css', markerAttr);
    await injectPageStyles('scripts/cashtag/pill/page.css', markerAttr);

    const styles = document.querySelectorAll(`style[${markerAttr}]`);
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe('.pill{display:inline}');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    removePageStyles(markerAttr);
    expect(document.querySelector(`style[${markerAttr}]`)).toBeNull();
  });

  it('skips injection when CSS fails to load', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => '',
    });

    await injectPageStyles('missing.css', markerAttr);

    expect(document.querySelector(`style[${markerAttr}]`)).toBeNull();
  });
});
