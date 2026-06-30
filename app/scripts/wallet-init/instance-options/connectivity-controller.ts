import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import type { WalletOptions } from '@metamask/wallet';

type ConnectivityControllerInstanceOptions =
  WalletOptions['instanceOptions']['connectivityController'];

/**
 * Build the extension's `ConnectivityController` instance options. The
 * extension constructs its `ConnectivityAdapter` (status pushed in from the
 * MV3 offscreen document / MV2 background page) and passes it through here.
 *
 * @param options - Options bag.
 * @param options.connectivityAdapter - Adapter that observes the device's
 * network connectivity.
 * @returns The extension `ConnectivityController` instance options.
 */
export function getConnectivityControllerInstanceOptions({
  connectivityAdapter,
}: {
  connectivityAdapter: ConnectivityAdapter;
}): ConnectivityControllerInstanceOptions {
  return {
    connectivityAdapter,
  };
}
