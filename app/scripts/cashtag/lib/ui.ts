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
      '.light,:root,[data-theme=light]{',
      ':host([data-theme=light]){',
    )
    .replaceAll('.dark,[data-theme=dark]{', ':host([data-theme=dark]){')
    .replaceAll(':root', ':host');
}

export function bindHostColorScheme(host: HTMLElement) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = () => {
    host.dataset.theme = media.matches ? 'dark' : 'light';
  };
  sync();
  media.addEventListener('change', sync);
  return () => {
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
