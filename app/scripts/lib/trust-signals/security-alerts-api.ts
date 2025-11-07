import { SECOND } from '../../../../shared/constants/time';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  AddAddressSecurityAlertResponse,
  createCacheKey,
  GetAddressSecurityAlertResponse,
  ResultType,
  ScanAddressRequest,
  ScanAddressResponse,
  SupportedEVMChain,
} from '../../../../shared/lib/trust-signals';

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

/**
 * Scans an address for security alerts, using cached response if available,
 * otherwise making a new API call and caching the result.
 *
 * @param address - The address to scan for security alerts
 * @param getAddressSecurityAlertResponse - Function to retrieve cached security alert response for an address
 * @param addAddressSecurityAlertResponse - Function to add a new security alert response to the cache
 * @param chain - The chain that the address exists on
 * @returns Promise that resolves to the security scan response containing result type and label
 */
export async function scanAddressAndAddToCache(
  address: string,
  getAddressSecurityAlertResponse: GetAddressSecurityAlertResponse,
  addAddressSecurityAlertResponse: AddAddressSecurityAlertResponse,
  chain: SupportedEVMChain,
): Promise<ScanAddressResponse> {
  const cacheKey = createCacheKey(chain, address);
  const cachedResponse = getAddressSecurityAlertResponse(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const loadingResponse: ScanAddressResponse = {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: ResultType.Loading,
    label: '',
  };
  addAddressSecurityAlertResponse(cacheKey, loadingResponse);

  try {
    const result = await scanAddress(chain, address);
    addAddressSecurityAlertResponse(cacheKey, result);
    return result;
  } catch (error) {
    const errorResponse: ScanAddressResponse = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.ErrorResult,
      label: '',
    };
    addAddressSecurityAlertResponse(cacheKey, errorResponse);
    throw error;
  }
}
