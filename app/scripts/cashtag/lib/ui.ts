import browser from 'webextension-polyfill';

export async function loadCss(pathFromExtensionRoot: string) {
  try {
    const response = await fetch(browser.runtime.getURL(pathFromExtensionRoot));
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

export function scopeDesignTokensForShadow(css: string) {
  if (!css) {
    return '';
  }

  // Design-token theme blocks key off document selectors. In a shadow root,
  // [data-theme] on the host only matches via :host(...); bare :root → :host
  // would make light always win and dark never apply.
  return css
    .replaceAll(
      '[data-theme=dark][data-pure-black=true]{',
      ':host([data-theme=dark]){',
    )
    .replaceAll(
      '.light,:root,[data-theme=light]{',
      ':host([data-theme=light]){',
    )
    .replaceAll('.dark,[data-theme=dark]{', ':host([data-theme=dark]){')
    .replaceAll(':root', ':host');
}

function readPageTheme(): 'light' | 'dark' {
  const pageTheme = document.documentElement.dataset.theme;
  if (pageTheme === 'dark' || pageTheme === 'dim') {
    return 'dark';
  }
  if (pageTheme === 'light') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function bindHostColorScheme(host: HTMLElement) {
  const sync = () => {
    host.dataset.theme = readPageTheme();
  };
  sync();

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', sync);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', sync);
  };
}

export async function injectPageStyles(cssPath: string, markerAttr: string) {
  if (document.querySelector(`style[${markerAttr}]`)) {
    return;
  }
  const css = await loadCss(cssPath);
  if (!css) {
    return;
  }
  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute(markerAttr, '');
  (document.head ?? document.documentElement).appendChild(style);
}

export function removePageStyles(markerAttr: string) {
  document.querySelector(`style[${markerAttr}]`)?.remove();
}
