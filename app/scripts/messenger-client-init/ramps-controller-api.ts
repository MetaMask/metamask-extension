import type { RampsController } from '@metamask/ramps-controller';

/**
 * Background API methods for the RampsController.
 *
 * @param rampsController - The ramps controller instance.
 * @returns API methods exposed to the UI via submitRequestToBackground.
 */
export function getRampsControllerApi(rampsController: RampsController) {
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
  };
}
