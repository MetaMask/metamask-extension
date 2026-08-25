import { bindHostColorScheme, injectPageStyles, removePageStyles } from './ui';

describe('bindHostColorScheme', () => {
  let listeners: ((event: MediaQueryListEvent) => void)[];
  let matches: boolean;

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
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
    document.documentElement.removeAttribute('data-theme');
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
  const markerAttr = 'data-mm-cashtag-test-css';

  beforeEach(() => {
    Object.assign(chrome.runtime, {
      getURL: (path: string) => `chrome-extension://test/${path}`,
    });
    document
      .querySelectorAll(`[${markerAttr}]`)
      .forEach((node) => node.remove());
  });

  it('links the stylesheet from the extension origin once per marker', async () => {
    await injectPageStyles('scripts/cashtag/pill/page.css', markerAttr);
    await injectPageStyles('scripts/cashtag/pill/page.css', markerAttr);

    const links = document.querySelectorAll<HTMLLinkElement>(
      `link[${markerAttr}]`,
    );
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe('stylesheet');
    expect(links[0].href).toBe(
      'chrome-extension://test/scripts/cashtag/pill/page.css',
    );
  });

  it('removes the stylesheet for the marker', async () => {
    await injectPageStyles('scripts/cashtag/pill/page.css', markerAttr);

    removePageStyles(markerAttr);

    expect(document.querySelector(`[${markerAttr}]`)).toBeNull();
  });
});
