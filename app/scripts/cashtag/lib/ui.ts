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
