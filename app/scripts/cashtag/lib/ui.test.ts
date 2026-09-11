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
    document
      .querySelectorAll(`[${markerAttr}]`)
      .forEach((node) => node.remove());
  });

  it('inlines the stylesheet once per marker', () => {
    injectPageStyles('a[data-mm-cashtag] { color: red; }', markerAttr);
    injectPageStyles('a[data-mm-cashtag] { color: blue; }', markerAttr);

    const styles = document.querySelectorAll<HTMLStyleElement>(
      `style[${markerAttr}]`,
    );
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe('a[data-mm-cashtag] { color: red; }');
  });

  it('removes the stylesheet for the marker', () => {
    injectPageStyles('a[data-mm-cashtag] { color: red; }', markerAttr);

    removePageStyles(markerAttr);

    expect(document.querySelector(`[${markerAttr}]`)).toBeNull();
  });
});
