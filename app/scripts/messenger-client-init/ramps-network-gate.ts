import type { RampsController } from '@metamask/ramps-controller';

export const RAMPS_NETWORK_ACCESS_DENIED_MESSAGE =
  'Ramps network access requires completed onboarding and basic functionality to be enabled.';

const RAMPS_NETWORK_METHOD_NAMES = [
  'init',
  'getCountries',
  'getTokens',
  'getProviders',
  'getPaymentMethods',
  'getQuotes',
  'getBuyWidgetData',
  'addPrecreatedOrder',
  'addOrder',
  'getOrder',
  'getOrderFromCallback',
] as const;

type RampsNetworkMethodName = (typeof RAMPS_NETWORK_METHOD_NAMES)[number];

/**
 * Throws when ramps network/API access is not allowed.
 *
 * @param isAllowed - Whether network access is permitted.
 */
export function assertRampsNetworkAllowed(isAllowed: boolean): void {
  if (!isAllowed) {
    throw new Error(RAMPS_NETWORK_ACCESS_DENIED_MESSAGE);
  }
}

/**
 * Wraps a ramps controller method so it throws before reaching RampsService when
 * onboarding is incomplete or basic functionality is disabled.
 *
 * @param method - The controller method to wrap.
 * @param isNetworkAllowed - Returns whether network access is permitted.
 * @returns The wrapped method.
 */
export function wrapRampsNetworkMethod<TArgs extends unknown[], TResult>(
  method: (...args: TArgs) => TResult,
  isNetworkAllowed: () => boolean,
): (...args: TArgs) => TResult {
  return (...args: TArgs) => {
    assertRampsNetworkAllowed(isNetworkAllowed());
    return method(...args);
  };
}

/**
 * Applies network-access guards to RampsController methods invoked via the
 * background API and messenger (e.g. TransactionPayController delegations).
 *
 * @param rampsController - The ramps controller instance.
 * @param isNetworkAllowed - Returns whether network access is permitted.
 */
export function applyRampsNetworkGate(
  rampsController: RampsController,
  isNetworkAllowed: () => boolean,
): void {
  const controller = rampsController as Record<
    RampsNetworkMethodName,
    (...args: unknown[]) => unknown
  >;

  for (const methodName of RAMPS_NETWORK_METHOD_NAMES) {
    const original = controller[methodName].bind(rampsController);
    controller[methodName] = wrapRampsNetworkMethod(original, isNetworkAllowed);
  }
}
