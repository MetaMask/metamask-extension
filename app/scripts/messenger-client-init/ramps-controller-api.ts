import type { RampsController } from '@metamask/ramps-controller';
import {
  createWatchRampsCheckoutTab,
  type WatchRampsCheckoutTabParams,
} from '../lib/ramps-checkout-watch';
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

  return {
    setRampsUserRegion: rampsController.setUserRegion.bind(rampsController),
    setRampsSelectedToken:
      rampsController.setSelectedToken.bind(rampsController),
    setRampsSelectedProvider:
      rampsController.setSelectedProvider.bind(rampsController),
    setRampsSelectedPaymentMethod:
      rampsController.setSelectedPaymentMethod.bind(rampsController),
    getRampsTokens: rampsController.getTokens.bind(rampsController),
    getRampsProviders: rampsController.getProviders.bind(rampsController),
    getRampsPaymentMethods:
      rampsController.getPaymentMethods.bind(rampsController),
    getRampsQuotes: rampsController.getQuotes.bind(rampsController),
    getRampsBuyWidgetData:
      rampsController.getBuyWidgetData.bind(rampsController),
    addRampsPrecreatedOrder:
      rampsController.addPrecreatedOrder.bind(rampsController),
    addRampsOrder: rampsController.addOrder.bind(rampsController),
    removeRampsOrder: rampsController.removeOrder.bind(rampsController),
    refreshRampsOrder: rampsController.getOrder.bind(rampsController),
    getRampsOrderFromCallback:
      rampsController.getOrderFromCallback.bind(rampsController),
    watchRampsCheckoutTab: (params: WatchRampsCheckoutTabParams) =>
      watchRampsCheckoutTab(params),
  };
}
