import browser from 'webextension-polyfill';

async function loadCss(pathFromExtensionRoot: string) {
  try {
    const url = browser.runtime.getURL(pathFromExtensionRoot);
    const response = await fetch(url);
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
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

export async function loadCssText(cssPath: string) {
  return loadCss(cssPath);
}
