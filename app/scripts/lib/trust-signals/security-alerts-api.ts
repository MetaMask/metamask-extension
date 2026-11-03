import {
  AddressScanResultType,
  PhishingController,
  type AddressScanResult,
} from '@metamask/phishing-controller';
import type { Hex } from '@metamask/utils';
import {
  AddAddressSecurityAlertResponse,
  createCacheKey,
  GetAddressSecurityAlertResponse,
  ResultType,
  ScanAddressResponse,
} from '../../../../shared/lib/trust-signals';

/**
 * Translates a PhishingController address-scan result into the extension's
 * ScanAddressResponse. The only wire-value divergence is the error case:
 * the controller uses 'ErrorResult' where the extension uses 'Error'.
 * Verdicts outside the controller's declared union (e.g. 'Trusted') are
 * passed through unchanged — the controller forwards the API's result_type
 * without validation.
 *
 * @param result - The PhishingController address-scan result to translate
 */
export function mapAddressScanResult(
  result: AddressScanResult,
): ScanAddressResponse {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type:
      result.result_type === AddressScanResultType.ErrorResult
        ? ResultType.ErrorResult
        : (result.result_type as unknown as ResultType),
    label: result.label ?? '',
  };
}

/**
 * Scans an address for security alerts via the PhishingController, using the
 * extension's cached response if available. A Loading placeholder is written
 * before the scan so UI consumers can render an in-flight state.
 *
 * @param address - The address to scan for security alerts
 * @param getAddressSecurityAlertResponse - Function to retrieve cached security alert response for an address
 * @param addAddressSecurityAlertResponse - Function to add a new security alert response to the cache
 * @param chainId - The hex chainId of the chain the address exists on
 * @param phishingController - Controller providing scanAddress; it resolves
 * chain support internally and returns ErrorResult for unsupported chains
 * @returns Promise that resolves to the security scan response containing result type and label
 */
export async function scanAddressAndAddToCache(
  address: string,
  getAddressSecurityAlertResponse: GetAddressSecurityAlertResponse,
  addAddressSecurityAlertResponse: AddAddressSecurityAlertResponse,
  chainId: Hex,
  phishingController: Pick<PhishingController, 'scanAddress'>,
): Promise<ScanAddressResponse> {
  const cacheKey = createCacheKey(chainId, address);
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

  // With the real PhishingController, scanAddress never rejects; every
  // failure (including unsupported chains) resolves to an ErrorResult. This
  // catch only guards against a malformed or nonconforming controller
  // instance (e.g. in tests) — do not remove it as "dead code", and note
  // that callers' `.catch` handlers will not fire under normal operation.
  try {
    const result = mapAddressScanResult(
      await phishingController.scanAddress(chainId, address),
    );
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
