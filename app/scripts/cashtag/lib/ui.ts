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

function styleTag(cssText: string) {
  const style = document.createElement('style');
  style.textContent = cssText;
  return style;
}

export async function injectPageStyles(cssPath: string, markerAttr: string) {
  if (document.querySelector(`style[${markerAttr}]`)) {
    return;
  }
  const css = await loadCss(cssPath);
  if (!css) {
    return;
  }
  const style = styleTag(css);
  style.setAttribute(markerAttr, '');
  (document.head ?? document.documentElement).appendChild(style);
}

export function removePageStyles(markerAttr: string) {
  document.querySelector(`style[${markerAttr}]`)?.remove();
}

export async function createShadowRootUi<TMounted>({
  name,
  cssPath,
  prepareHost,
  onMount,
  onRemove,
}: {
  name: string;
  cssPath: string;
  prepareHost?: (host: HTMLElement) => void;
  onMount: (container: HTMLElement, shadow: ShadowRoot) => TMounted;
  onRemove?: (mounted: TMounted | undefined) => void;
}) {
  const css = await loadCss(cssPath);
  const shadowHost = document.createElement('div');
  shadowHost.id = name;
  prepareHost?.(shadowHost);

  const shadow = shadowHost.attachShadow({ mode: 'open' });
  shadow.appendChild(styleTag(css.replaceAll(':root', ':host')));

  const container = document.createElement('div');
  shadow.appendChild(container);

  let mounted: TMounted | undefined;
  let isMounted = false;

  return {
    shadowHost,
    get mounted() {
      return mounted;
    },
    mount() {
      if (isMounted) {
        return;
      }
      document.documentElement.appendChild(shadowHost);
      mounted = onMount(container, shadow);
      isMounted = true;
    },
    remove() {
      if (!isMounted) {
        return;
      }
      onRemove?.(mounted);
      mounted = undefined;
      isMounted = false;
      shadowHost.remove();
    },
  };
}
