import type { Hex } from '@metamask/utils';
import {
  extractSignatureAddresses,
  isAddressScanSupportedChainId,
  type PhishingController,
} from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { parseTypedDataMessage } from '../../../../shared/lib/transaction.utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { getSignatureAddressExtractionOptions } from '../../../../shared/lib/signature-addresses';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';

type AppStateCache = Pick<
  AppStateController,
  'getAddressSecurityAlertResponse' | 'addAddressSecurityAlertResponse'
>;

/**
 * Scan the address fields of a typed-data signature request against the
 * real-time security-alerts API. Called when the request arrives, and may be
 * retried after a non-flagged PPOM result. Results are cached so addresses
 * scanned elsewhere are not re-requested.
 *
 * @param options - Request, chain, and cache used to scan signature addresses.
 * @param options.request - JSON-RPC signature request.
 * @param options.request.method - RPC method name.
 * @param options.request.params - RPC params (`from`, typed data).
 * @param options.chainId - Hex chain ID of the request.
 * @param options.appStateController - Address-scan cache accessors.
 * @param options.phishingController - Controller providing scanAddress.
 */
export function scanUnvalidatedSignatureAddresses(options: {
  request: { method: string; params?: unknown };
  chainId: Hex;
  appStateController: AppStateCache;
  phishingController: Pick<PhishingController, 'scanAddress'>;
}): void {
  const { request, chainId, appStateController, phishingController } = options;
  if (
    request.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 &&
    request.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  ) {
    return;
  }

  if (!isSecurityAlertsAPIEnabled()) {
    return;
  }

  const { params } = request;
  if (!Array.isArray(params) || params[1] === undefined || params[1] === null) {
    return;
  }

  if (!isAddressScanSupportedChainId(chainId)) {
    return;
  }

  let typedDataMessage;
  try {
    typedDataMessage = parseTypedDataMessage(
      typeof params[1] === 'string' ? params[1] : JSON.stringify(params[1]),
    );
  } catch (error) {
    console.error('Error parsing typed data for signature address scan', error);
    return;
  }

  const signerAddress = typeof params[0] === 'string' ? params[0] : undefined;

  const { addresses } = extractSignatureAddresses(
    typedDataMessage,
    getSignatureAddressExtractionOptions(typedDataMessage, signerAddress),
  );

  for (const address of addresses) {
    scanAddressAndAddToCache(
      address,
      appStateController.getAddressSecurityAlertResponse,
      appStateController.addAddressSecurityAlertResponse,
      chainId,
      phishingController,
    ).catch((error) => {
      console.error('Error scanning signature address', error);
    });
  }
}
