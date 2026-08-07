import type { Hex } from '@metamask/utils';
import type { AppStateController } from '../../controllers/app-state-controller';
import { parseTypedDataMessage } from '../../../../shared/lib/transaction.utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  mapChainIdToSupportedEVMChain,
  extractSignatureAddresses,
} from '../../../../shared/lib/trust-signals';
import { PRIMARY_TYPES_PERMIT } from '../../../../shared/constants/signatures';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';

type AppStateCache = Pick<
  AppStateController,
  'getAddressSecurityAlertResponse' | 'addAddressSecurityAlertResponse'
>;

/**
 * Scan the address fields of a signature request in real time.
 *
 * PPOM's threat data is refreshed on a delay, so an address it reports as benign
 * may already be flagged. Calling the real-time address scan when PPOM has not
 * flagged the request surfaces those addresses. Results are cached, so addresses
 * already scanned elsewhere are not requested again.
 *
 * @param options
 * @param options.request - The signature JSON-RPC request.
 * @param options.request.method - The JSON-RPC method (`eth_signTypedData_v3`/`v4`).
 * @param options.request.params - The JSON-RPC params, `[signer, typedData]`.
 * @param options.chainId - The chain the signature is scoped to.
 * @param options.appStateController - Address-scan cache accessors.
 */
export function scanUnvalidatedSignatureAddresses({
  request,
  chainId,
  appStateController,
}: {
  request: { method: string; params?: unknown };
  chainId: Hex;
  appStateController: AppStateCache;
}): void {
  if (
    request.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 &&
    request.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  ) {
    return;
  }

  // The scan posts to the external security-alerts API; skip it when that API
  // is disabled, matching the trust-signals middleware.
  if (!isSecurityAlertsAPIEnabled()) {
    return;
  }

  const { params } = request;
  if (!Array.isArray(params) || params[1] === undefined || params[1] === null) {
    return;
  }

  const supportedEVMChain = mapChainIdToSupportedEVMChain(chainId);
  if (!supportedEVMChain) {
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

  // Match the exclusions applied by `useSignatureAddressAlerts` so the scanned
  // set and the set the UI raises alerts about stay identical. The trust-signals
  // middleware only scans the permit `spender` when the domain has a
  // `verifyingContract`, so exclude it here only in that case; otherwise keep
  // scanning it so it is not dropped.
  const isPermit = PRIMARY_TYPES_PERMIT.some(
    (type) => type === typedDataMessage.primaryType,
  );
  const hasVerifyingContract = Boolean(
    typedDataMessage.domain?.verifyingContract,
  );

  const { addresses } = extractSignatureAddresses(typedDataMessage, {
    exclude: signerAddress ? [signerAddress] : [],
    excludeFields: isPermit && hasVerifyingContract ? ['spender'] : [],
  });

  for (const address of addresses) {
    scanAddressAndAddToCache(
      address,
      appStateController.getAddressSecurityAlertResponse,
      appStateController.addAddressSecurityAlertResponse,
      supportedEVMChain,
    ).catch((error) => {
      console.error('Error scanning signature address', error);
    });
  }
}
