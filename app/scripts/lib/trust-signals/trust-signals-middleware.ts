import { Hex, JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
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
  parseTransferTransactionData,
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
  isConnected,
  connectScreenHasBeenPrompted,
  isEip7715AdvancedPermissionsRequest,
} from './trust-signals-util';

export type TrustSignalsMiddlewareRequest = JsonRpcRequest & {
  origin?: string;
  requestUrl?: string;
  networkClientId: NetworkClientId;
};

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
  phishingController: PhishingController,
  preferencesController: PreferencesController,
  getPermittedAccounts: (origin: string) => string[],
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

      if (isEthSendTransaction(req)) {
        handleEthSendTransaction(
          req,
          appStateController,
          networkController,
          phishingController,
        );
        scanUrl(req, phishingController);
      } else if (isWalletSendCalls(req)) {
        handleWalletSendCalls(
          req,
          appStateController,
          networkController,
          phishingController,
        );
        scanUrl(req, phishingController);
      } else if (isEthSignTypedData(req)) {
        handleEthSignTypedData(
          req,
          appStateController,
          networkController,
          phishingController,
        );
        scanUrl(req, phishingController);
      } else if (isConnected(req, getPermittedAccounts)) {
        scanUrl(req, phishingController);
      } else if (connectScreenHasBeenPrompted(req)) {
        scanUrl(req, phishingController);
      } else if (isEip7715AdvancedPermissionsRequest(req)) {
        scanUrl(req, phishingController);
      }
    } catch (error) {
      console.error('[createTrustSignalsMiddleware] error: ', error);
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
      console.error('[createTrustSignalsMiddleware] error:', error);
    });
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

  // Scan the 'to' address (contract address)
  scanAddressAndAddToCache(
    to,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    rawChainId,
    phishingController,
  ).catch((error) => {
    console.error(
      '[createTrustSignalsMiddleware] error scanning address for transaction:',
      error,
    );
  });

  // If this is an approval or a token transfer, also scan the addresses
  // encoded in calldata (approval spender / transfer recipient).
  if (data && typeof data === 'string') {
    scanCalldataAddresses(
      data as Hex,
      appStateController,
      rawChainId,
      phishingController,
      'transaction',
    );
  }
}

/**
 * Scans addresses that are encoded in transaction calldata rather than
 * `txParams.to`: the spender of a token approval and the recipient of an
 * ERC-20/721/1155 token transfer (for transfers, `to` is only the token
 * contract — the funds move to the address inside the calldata).
 *
 * @param data - The transaction calldata
 * @param appStateController - AppStateController holding the verdict cache
 * @param chainId - The chain the transaction targets
 * @param phishingController - PhishingController performing the scan
 * @param context - Label used in error logs (e.g. 'transaction', 'sendCalls')
 */
function scanCalldataAddresses(
  data: Hex,
  appStateController: AppStateController,
  chainId: Hex,
  phishingController: PhishingController,
  context: string,
) {
  const spenderAddress = parseApprovalTransactionData(data)?.spender;
  const transferRecipient = parseTransferTransactionData(data)?.recipient;

  for (const [label, address] of [
    ['spender', spenderAddress],
    ['transfer recipient', transferRecipient],
  ] as const) {
    if (!address) {
      continue;
    }
    scanAddressAndAddToCache(
      address,
      appStateController.getAddressSecurityAlertResponse,
      appStateController.addAddressSecurityAlertResponse,
      chainId,
      phishingController,
    ).catch((error) => {
      console.error(
        `[createTrustSignalsMiddleware] error scanning ${label} address for ${context}:`,
        error,
      );
    });
  }
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

  const { calls, chainId: requestChainId } = req.params[0];

  const { chainId: rawChainId } =
    networkController.getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return;
  }

  // EIP-5792 requests may declare the batch's chain. The 5792 handler
  // (`validateDappChainId` in @metamask/eip-5792-middleware) rejects requests
  // whose declared chainId differs from the dapp-selected network, so skip
  // scanning rather than cache verdicts under a key no confirmation will read.
  if (
    typeof requestChainId === 'string' &&
    requestChainId.toLowerCase() !== rawChainId.toLowerCase()
  ) {
    return;
  }

  for (const call of calls) {
    const { to, data } = call;

    // Calls without a recipient (contract deployments) have nothing to scan.
    if (typeof to === 'string') {
      scanAddressAndAddToCache(
        to,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        rawChainId,
        phishingController,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning address for sendCalls:',
          error,
        );
      });
    }

    // If a nested call is an approval or a token transfer, also scan the
    // addresses encoded in its calldata — parity with eth_sendTransaction.
    if (typeof data === 'string') {
      scanCalldataAddresses(
        data as Hex,
        appStateController,
        rawChainId,
        phishingController,
        'sendCalls',
      );
    }
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
  scanAddressAndAddToCache(
    verifyingContract,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    rawChainId,
    phishingController,
  ).catch((error) => {
    console.error(
      '[createTrustSignalsMiddleware] error scanning address for signature:',
      error,
    );
  });

  const { primaryType }: { primaryType: string } = typedDataMessage;
  if (!primaryType) {
    return;
  }

  // If this is a permit signature, also scan the spender address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (PRIMARY_TYPES_PERMIT.includes(primaryType as any)) {
    const spenderAddress = typedDataMessage.message?.spender;
    if (spenderAddress) {
      scanAddressAndAddToCache(
        spenderAddress,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        rawChainId,
        phishingController,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning spender address for permit:',
          error,
        );
      });
    }
  }

  // If this is a delegation signature, scan the delegate address
  if (primaryType === PRIMARY_TYPE_DELEGATION) {
    const delegateAddress = typedDataMessage.message?.delegate;
    if (delegateAddress) {
      scanAddressAndAddToCache(
        delegateAddress,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        rawChainId,
        phishingController,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning delegate address for delegation:',
          error,
        );
      });
    }
  }
}
