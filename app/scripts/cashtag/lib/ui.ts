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
  return css
    .replaceAll(
      '.dark [data-pure-black=true],.dark[data-pure-black=true],[data-pure-black=true] .dark,[data-theme=dark] [data-pure-black=true],[data-theme=dark] [data-pure-black=true] .dark,[data-theme=dark][data-pure-black=true]',
      ':host([data-theme=dark][data-pure-black=true]),:host(.dark[data-pure-black=true])',
    )
    .replaceAll(
      '.light,:root,[data-theme=light]',
      ':host(.light),:host([data-theme=light])',
    )
    .replaceAll(
      '.dark,[data-theme=dark]',
      ':host(.dark),:host([data-theme=dark])',
    )
    .replaceAll(':root', ':host');
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
