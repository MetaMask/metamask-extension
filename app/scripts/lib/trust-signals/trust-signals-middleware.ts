import { JsonRpcRequest, JsonRpcResponse, type Hex } from '@metamask/utils';
import {
  NetworkController,
  NetworkClientId,
} from '@metamask/network-controller';
import { PhishingController } from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { PreferencesController } from '../../controllers/preferences-controller';
import {
  parseTypedDataMessage,
  parseApprovalTransactionData,
} from '../../../../shared/lib/transaction.utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { PRIMARY_TYPES_PERMIT } from '../../../../shared/constants/signatures';
import { PRIMARY_TYPE_DELEGATION } from '../transaction/delegation';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';
import {
  hasValidTypedDataParams,
  isEthSignTypedData,
  isEthSendTransaction,
  isWalletSendCalls,
  hasValidTransactionParams,
  hasValidSendCallsParams,
  isSecurityAlertsEnabledByUser,
} from './trust-signals-util';

export type TrustSignalsMiddlewareRequest = JsonRpcRequest & {
  origin?: string;
  requestUrl?: string;
  networkClientId: NetworkClientId;
};

/**
 * Scan the requesting origin. Kept separate from address scanning because the
 * two need different positions in the Multichain API stack: the origin scan has
 * to run above the session handlers, which answer `wallet_createSession` and
 * `wallet_getSession` without passing them down.
 *
 * @param phishingController - Owns the URL scan and its cache
 * @param preferencesController - Source of the user's security alerts setting
 * @param shouldScanOrigin - Per-transport gate, since no method name is shared
 * @param requestUrl - Full sender URL, preferred over the bare origin
 */
export function createOriginScanMiddleware(
  phishingController: PhishingController,
  preferencesController: PreferencesController,
  shouldScanOrigin: (req: TrustSignalsMiddlewareRequest) => boolean,
  requestUrl?: string,
) {
  return async (
    req: TrustSignalsMiddlewareRequest,
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
      req.requestUrl = requestUrl;

      if (
        !isSecurityAlertsEnabledByUser(preferencesController) ||
        !isSecurityAlertsAPIEnabled()
      ) {
        return;
      }

      if (shouldScanOrigin(req)) {
        scanUrl(req, phishingController);
      }
    } catch (error) {
      console.error('[createOriginScanMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

/**
 * Scan the addresses a request touches. Gated on the EIP-1193 method name on
 * both transports, since Multichain API requests reach this point already
 * unwrapped.
 *
 * @param networkController - Resolves the request's chain
 * @param appStateController - Holds the verdict cache the confirmation UI reads
 * @param phishingController - Performs the address scan
 * @param preferencesController - Source of the user's security alerts setting
 */
export function createAddressScanMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
  phishingController: PhishingController,
  preferencesController: PreferencesController,
) {
  return async (
    req: TrustSignalsMiddlewareRequest,
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
      if (
        !isSecurityAlertsEnabledByUser(preferencesController) ||
        !isSecurityAlertsAPIEnabled()
      ) {
        return;
      }

      if (isEthSendTransaction(req)) {
        handleEthSendTransaction(
          req,
          appStateController,
          networkController,
          phishingController,
        );
      } else if (isWalletSendCalls(req)) {
        handleWalletSendCalls(
          req,
          appStateController,
          networkController,
          phishingController,
        );
      } else if (isEthSignTypedData(req)) {
        handleEthSignTypedData(
          req,
          appStateController,
          networkController,
          phishingController,
        );
      }
    } catch (error) {
      console.error('[createAddressScanMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

function scanUrl(
  req: TrustSignalsMiddlewareRequest,
  phishingController: PhishingController,
) {
  const urlToScan = req.requestUrl ?? req.origin;

  if (urlToScan) {
    phishingController.scanUrl(urlToScan).catch((error) => {
      console.error('[createOriginScanMiddleware] error:', error);
    });
  }
}

/**
 * Fire-and-forget an address scan, logging (rather than propagating) any
 * failure so one rejected scan cannot affect the middleware pipeline.
 *
 * @param address - The address to scan
 * @param logLabel - Describes the address's role in the error log message
 * @param chainId - The hex chainId of the chain the address exists on
 * @param appStateController - Provides the security alert response cache
 * @param phishingController - Controller providing scanAddress
 */
function scanAddressInBackground(
  address: string,
  logLabel: string,
  chainId: Hex,
  appStateController: AppStateController,
  phishingController: PhishingController,
) {
  scanAddressAndAddToCache(
    address,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    chainId,
    phishingController,
  ).catch((error) => {
    console.error(
      `[createAddressScanMiddleware] error scanning ${logLabel}:`,
      error,
    );
  });
}

/**
 * Scans the addresses a single transaction or batched call exposes: its
 * target `to` plus any addresses encoded in calldata (currently the spender
 * of a token approval). Shared by the `eth_sendTransaction` and
 * `wallet_sendCalls` handlers so decoding logic stays in one place; new
 * calldata decoders should be added here to cover both paths at once.
 *
 * @param to - The call's target address
 * @param data - The call's calldata, if any
 * @param context - Label describing the request type in scan error logs
 * @param chainId - The hex chainId of the chain the call targets
 * @param appStateController - Provides the security alert response cache
 * @param phishingController - Controller providing scanAddress
 */
function scanCallTargets(
  to: unknown,
  data: unknown,
  context: 'transaction' | 'sendCalls',
  chainId: Hex,
  appStateController: AppStateController,
  phishingController: PhishingController,
) {
  // `to` may be unvalidated dapp input (batched calls are only validated
  // downstream, by SendCallsStruct in the 5792 handler); a non-string would
  // throw in createCacheKey. Deliberately no stricter than the struct's
  // address check, so nothing the wallet would execute can skip scanning.
  if (typeof to === 'string') {
    scanAddressInBackground(
      to,
      `address for ${context}`,
      chainId,
      appStateController,
      phishingController,
    );
  }

  // If the call is a token approval, also scan the spender address.
  if (typeof data === 'string') {
    const approvalData = parseApprovalTransactionData(data as `0x${string}`);
    const spenderAddress = approvalData?.spender;
    if (spenderAddress) {
      scanAddressInBackground(
        spenderAddress,
        `spender address for ${context} approval`,
        chainId,
        appStateController,
        phishingController,
      );
    }
  }
}

function handleEthSendTransaction(
  req: TrustSignalsMiddlewareRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
  phishingController: PhishingController,
) {
  if (!hasValidTransactionParams(req)) {
    return;
  }

  const { to, data } = req.params[0];

  const { chainId: rawChainId } =
    networkController.getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return;
  }

  scanCallTargets(
    to,
    data,
    'transaction',
    rawChainId,
    appStateController,
    phishingController,
  );
}

function handleWalletSendCalls(
  req: TrustSignalsMiddlewareRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
  phishingController: PhishingController,
) {
  if (!hasValidSendCallsParams(req)) {
    return;
  }

  const { calls } = req.params[0];

  const { chainId: rawChainId } =
    networkController.getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return;
  }

  // The declared `params[0].chainId` is deliberately ignored: the 5792 handler
  // rejects mismatches with the dapp-selected network downstream
  // (`validateDappChainId` in @metamask/eip-5792-middleware), and duplicating
  // its comparison here would risk drifting stricter than it and silently
  // skipping scans for requests the wallet executes. Scanning a to-be-rejected
  // request only writes harmless cache entries. See PSAFE-613.
  for (const call of calls) {
    // Malformed entries are skipped rather than failing the whole batch, so
    // scan coverage of well-formed calls does not depend on downstream
    // validation rejecting the request first.
    if (typeof call !== 'object' || call === null) {
      continue;
    }

    const { to, data } = call as { to?: unknown; data?: unknown };

    scanCallTargets(
      to,
      data,
      'sendCalls',
      rawChainId,
      appStateController,
      phishingController,
    );
  }
}

function handleEthSignTypedData(
  req: TrustSignalsMiddlewareRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
  phishingController: PhishingController,
) {
  if (
    req.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 &&
    req.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  ) {
    return;
  }

  if (!hasValidTypedDataParams(req)) {
    return;
  }

  const typedDataMessage = parseTypedDataMessage(
    typeof req.params[1] === 'string'
      ? req.params[1]
      : JSON.stringify(req.params[1]),
  );
  const verifyingContract = typedDataMessage.domain?.verifyingContract;
  if (!verifyingContract) {
    return;
  }

  const { chainId: rawChainId } =
    networkController.getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return;
  }

  // Scan the verifying contract address (token contract)
  scanAddressInBackground(
    verifyingContract,
    'address for signature',
    rawChainId,
    appStateController,
    phishingController,
  );

  const { primaryType }: { primaryType: string } = typedDataMessage;
  if (!primaryType) {
    return;
  }

  // If this is a permit signature, also scan the spender address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (PRIMARY_TYPES_PERMIT.includes(primaryType as any)) {
    const spenderAddress = typedDataMessage.message?.spender;
    if (spenderAddress) {
      scanAddressInBackground(
        spenderAddress,
        'spender address for permit',
        rawChainId,
        appStateController,
        phishingController,
      );
    }
  }

  // If this is a delegation signature, scan the delegate address
  if (primaryType === PRIMARY_TYPE_DELEGATION) {
    const delegateAddress = typedDataMessage.message?.delegate;
    if (delegateAddress) {
      scanAddressInBackground(
        delegateAddress,
        'delegate address for delegation',
        rawChainId,
        appStateController,
        phishingController,
      );
    }
  }
}
