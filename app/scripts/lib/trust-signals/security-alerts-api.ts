import { NetworkController } from '@metamask/network-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { SECOND } from '../../../../shared/constants/time';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  ScanAddressRequest,
  ScanAddressResponse,
  SupportedEVMChain,
} from './types';
import { getChainId } from './trust-signals-util';

const TIMEOUT = 5 * SECOND;
const ENDPOINT_ADDRESS_SCAN = 'address/evm/scan';

export async function scanAddress(
  chain: SupportedEVMChain,
  address: string,
): Promise<ScanAddressResponse> {
  const baseUrl = process.env.SECURITY_ALERTS_API_URL;
  if (!baseUrl) {
    throw new Error('SECURITY_ALERTS_API_URL is not set');
  }
  const endpoint = `${baseUrl}/${ENDPOINT_ADDRESS_SCAN}`;
  const body: ScanAddressRequest = {
    chain,
    address,
  };

  const response = await getFetchWithTimeout(TIMEOUT)(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
}

export async function scanAddressAndAddToCache(
  address: string,
  appStateController: AppStateController,
  networkController?: NetworkController,
  chainId?: SupportedEVMChain,
): Promise<ScanAddressResponse> {
  let chainID = chainId;
  const cachedResponse =
    appStateController.getAddressSecurityAlertResponse(address);
  if (cachedResponse) {
    return cachedResponse;
  }

  if (networkController) {
    chainID = getChainId(networkController);
  }

  if (!chainID) {
    throw new Error('[scanAddressAndAddToCache] chainId is not set');
  }

  const result = await scanAddress(chainID, address);
  appStateController.addAddressSecurityAlertResponse(address, result);
  return result;
}
