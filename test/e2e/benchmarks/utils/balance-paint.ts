/**
 * Reads when the first home frame was presented, using Element Timing.
 * `renderTime` of a text node or image is the presentation time of the frame
 * that first painted it, in milliseconds since navigation start. The balance
 * text, the first token's name and its icon are tagged by the UI with
 * `elementtiming` attributes (TEMPORARY probes, see AccountGroupBalance,
 * AssetCellTitle and AvatarToken).
 *
 * Unlike Homepage Ready (JS signals) and FCP (the static pre-React screen),
 * these move when React's first home frame is delayed on the main thread, for
 * example by a synchronous image decode.
 *
 * LavaMoat scuttling hides `PerformanceObserver` from the page's global scope
 * in production builds, so a script run after load cannot create an observer.
 * Instead, a script registered through CDP runs before the page's own scripts,
 * creates the observer, and keeps the entries on `document` (not scuttled).
 */

import type { Driver } from '../../webdriver/driver';

export type PaintDiagnostics = {
  balancePainted: number | null;
  tokenNamePainted: number | null;
  tokenIconPainted: number | null;
  shellPainted: number | null;
  shellInserted: number | null;
  tokenImages: number;
  maxIconNaturalWidth: number;
  iconResponseEnd: number | null;
  iconTransferSize: number | null;
};

const OBSERVER_SCRIPT = `
  try {
    const seen = [];
    document.__elementTimings = seen;
    new PerformanceObserver((list) => seen.push(...list.getEntries())).observe({
      type: 'element',
      buffered: true,
    });
  } catch (e) {
    document.__elementTimings = null;
  }
`;

const READ_SCRIPT = `
  const imgs = Array.from(document.querySelectorAll('img[src*="tokenIcons"]'));
  const icon = performance
    .getEntriesByType('resource')
    .find((r) => r.name.includes('tokenIcons'));
  const entries = document.__elementTimings || [];
  const time = (id) => {
    const e = entries.find((x) => x.identifier === id);
    return e ? e.renderTime || e.loadTime || null : null;
  };
  return {
    balancePainted: time('balance'),
    tokenNamePainted: time('token-name'),
    tokenIconPainted: time('token-icon'),
    shellPainted: time('shell-balance'),
    shellInserted: (performance.getEntriesByName('home-shell-inserted')[0] || {}).startTime ?? null,
    tokenImages: imgs.length,
    maxIconNaturalWidth: imgs.reduce((m, i) => Math.max(m, i.naturalWidth), 0),
    iconResponseEnd: icon ? icon.responseEnd : null,
    iconTransferSize: icon ? icon.transferSize : null,
    entryCount: document.__elementTimings ? entries.length : -1,
  };
`;

type CdpInnerDriver = {
  sendDevToolsCommand?: (
    command: string,
    params?: Record<string, unknown>,
  ) => Promise<unknown>;
};

/**
 * Registers the observer script for every document the tab loads from now on.
 *
 * @param driver - MetaMask Selenium driver wrapper
 */
export async function installPaintObserver(driver: Driver): Promise<void> {
  const innerDriver = driver.driver as CdpInnerDriver | undefined;
  if (!innerDriver?.sendDevToolsCommand) {
    throw new Error('CDP is required for the paint observer');
  }
  await innerDriver.sendDevToolsCommand(
    'Page.addScriptToEvaluateOnNewDocument',
    { source: OBSERVER_SCRIPT },
  );
}

/**
 * Reads the paint timings. Entries arrive after the frames are presented, so
 * call this a moment after the page has settled.
 *
 * @param driver - MetaMask Selenium driver wrapper
 */
export async function collectPaintTimings(
  driver: Driver,
): Promise<PaintDiagnostics> {
  return (await driver.executeScript(READ_SCRIPT)) as PaintDiagnostics;
}
