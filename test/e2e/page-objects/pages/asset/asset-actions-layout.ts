import { Driver } from '../../../webdriver/driver';

/**
 * Which action row the asset overview settled on.
 *
 * `perps` means Long / Short took over the row and pushed Buy / Swap into the
 * More menu. `prefix` mirrors the `classPrefix` the UI passes to the buttons:
 * `coin` for the native overview, `token` for the token overview.
 *
 * @see ui/components/app/wallet-overview/coin-buttons.tsx
 */
export type AssetActionsLayout = {
  type: 'perps' | 'standard';
  prefix: 'coin' | 'token';
};

const ACTIONS_LAYOUT_TIMEOUT_MS = 15000;

const PARENT_SELECTOR = '[data-testid="parent-selector-asset-details"]';

const PERPS_ACTIONS_SKELETON = '[data-testid="asset-perps-actions-skeleton"]';

const PREFIXES = ['coin', 'token'] as const;

async function readActionsLayout(
  driver: Driver,
): Promise<AssetActionsLayout | null> {
  for (const prefix of PREFIXES) {
    const hasLong = await driver.isElementPresentAndVisible(
      `[data-testid="${prefix}-overview-long"]`,
      250,
    );
    if (hasLong) {
      return { type: 'perps', prefix };
    }
  }

  for (const prefix of PREFIXES) {
    const hasSwap = await driver.isElementPresentAndVisible(
      `[data-testid="${prefix}-overview-swap"]`,
      250,
    );
    if (hasSwap) {
      return { type: 'standard', prefix };
    }
  }

  return null;
}

/**
 * Waits for the async Perps market and position lookups to resolve, then reads
 * the action row once.
 *
 * The asset page renders `asset-perps-actions-skeleton` while those lookups are
 * pending and only then commits to Perps or standard actions, so the row cannot
 * flip under a caller and no layout-stability polling is needed.
 *
 * @param driver - Webdriver instance already on an asset details page.
 * @returns The layout the asset page committed to.
 */
export async function readResolvedAssetActionsLayout(
  driver: Driver,
): Promise<AssetActionsLayout> {
  await driver.assertElementNotPresent(PERPS_ACTIONS_SKELETON, {
    findElementGuard: PARENT_SELECTOR,
    timeout: ACTIONS_LAYOUT_TIMEOUT_MS,
  });

  let layout: AssetActionsLayout | null = null;

  await driver.waitUntil(
    async () => {
      layout = await readActionsLayout(driver);
      return layout !== null;
    },
    { timeout: ACTIONS_LAYOUT_TIMEOUT_MS, interval: 250 },
  );

  if (!layout) {
    throw new Error('Asset action buttons did not render a known layout.');
  }

  return layout;
}
