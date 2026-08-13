import type { Hex } from '@metamask/utils';
import { extractSignatureAddresses } from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { parseTypedDataMessage } from '../../../../shared/lib/transaction.utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { mapChainIdToSupportedEVMChain } from '../../../../shared/lib/trust-signals';
import { PRIMARY_TYPES_PERMIT } from '../../../../shared/constants/signatures';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';

type AppStateCache = Pick<
  AppStateController,
  'getAddressSecurityAlertResponse' | 'addAddressSecurityAlertResponse'
>;

/**
 * Scan the address fields of a typed-data signature request against the
 * real-time security-alerts API. Called after PPOM when PPOM has not flagged
 * the request, since PPOM's threat data is refreshed on a delay. Results are
 * cached so addresses scanned elsewhere are not re-requested.
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
