import type { WalletOptions } from '@metamask/wallet';
import {
  GAS_API_BASE_URL,
  GAS_DEV_API_BASE_URL,
  SWAPS_CLIENT_ID,
} from '../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getGlobalChainId } from '../../messenger-client-init/init-utils';
import { GasFeeControllerInitMessenger } from '../messengers/gas-fee-controller-messenger';

type GasFeeControllerInstanceOptions = NonNullable<
  NonNullable<WalletOptions['instanceOptions']>['gasFeeController']
>;

type GetGasFeeControllerInstanceOptionsRequest = {
  initMessenger: GasFeeControllerInitMessenger;
};

const GAS_API_URL = process.env.SWAPS_USE_DEV_APIS
  ? GAS_DEV_API_BASE_URL
  : GAS_API_BASE_URL;

/**
 * Build the extension's client-specific options for the wallet-owned
 * `GasFeeController`. The wallet supplies the provider and network callbacks
 * from `NetworkController`; the extension only overrides the API endpoints,
 * client ID, poll interval, and the legacy gas API compatibility check.
 *
 * @param request - The request object.
 * @param request.initMessenger - Messenger used to read the global chain ID.
 * @returns The gas fee controller instance options.
 */
export function getGasFeeControllerInstanceOptions({
  initMessenger,
}: GetGasFeeControllerInstanceOptionsRequest): GasFeeControllerInstanceOptions {
  return {
    interval: 10_000,
    clientId: SWAPS_CLIENT_ID,
    legacyAPIEndpoint: `${GAS_API_URL}/networks/<chain_id>/gasPrices`,
    EIP1559APIEndpoint: `${GAS_API_URL}/networks/<chain_id>/suggestedGasFees`,
    getCurrentNetworkLegacyGasAPICompatibility: () => {
      const chainId = getGlobalChainId(initMessenger);
      return chainId === CHAIN_IDS.BSC;
    },
  };
}
