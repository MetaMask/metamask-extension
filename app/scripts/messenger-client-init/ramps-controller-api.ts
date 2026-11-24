import type { RampsController } from '@metamask/ramps-controller';
import {
  createWatchRampsCheckoutTab,
  createWatchRampsOrderTab,
  type WatchRampsCheckoutTabParams,
  type WatchRampsOrderTabParams,
} from '../lib/ramps/checkout-watch';
import type ExtensionPlatform from '../platforms/extension';

/**
 * Background API methods for the RampsController.
 *
 * @param rampsController - The ramps controller instance.
 * @param platform - Extension platform used to watch checkout tabs.
 * @returns API methods exposed to the UI via submitRequestToBackground.
 */
export function getRampsControllerApi(
  rampsController: RampsController,
  platform: ExtensionPlatform,
) {
  const watchRampsCheckoutTab = createWatchRampsCheckoutTab(
    platform,
    rampsController,
  );
  const watchRampsOrderTab = createWatchRampsOrderTab(
    platform,
    rampsController,
  );

  return {
    watchRampsCheckoutTab: (params: WatchRampsCheckoutTabParams) =>
      watchRampsCheckoutTab(params),
    watchRampsProviderOrderTab: (params: WatchRampsOrderTabParams) =>
      watchRampsOrderTab(params),
  };
}
