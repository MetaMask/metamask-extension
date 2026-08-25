export function readPageTheme(): 'light' | 'dark' {
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

export function bindHostColorScheme(
  host: HTMLElement,
  onChange?: (theme: 'light' | 'dark') => void,
) {
  const sync = () => {
    const theme = readPageTheme();
    host.dataset.theme = theme;
    onChange?.(theme);
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
  if (document.querySelector(`[${markerAttr}]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL(cssPath);
  link.setAttribute(markerAttr, '');
  (document.head ?? document.documentElement).appendChild(link);
}

export function removePageStyles(markerAttr: string) {
  document.querySelector(`[${markerAttr}]`)?.remove();
}
