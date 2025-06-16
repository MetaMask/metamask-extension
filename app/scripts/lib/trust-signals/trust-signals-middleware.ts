import { JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import {
  parseTypedDataMessage,
  parseStandardTokenTransactionData,
} from '../../../../shared/modules/transaction.utils';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';
import {
  hasValidTypedDataParams,
  isEthSignTypedData,
  isEthSendTransaction,
  hasValidTransactionParams,
  isProdEnabled,
} from './trust-signals-util';

type ParsedTypedDataMessage = {
  primaryType: string;
  message: Record<string, unknown>;
  domain?: {
    verifyingContract?: string;
    [key: string]: unknown;
  };
  types?: Record<string, unknown>;
};

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
) {
  return async (
    req: JsonRpcRequest,
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
      if (!isSecurityAlertsAPIEnabled() || !isProdEnabled()) {
        return;
      }

      if (isEthSendTransaction(req)) {
        await handleEthSendTransaction(
          req,
          appStateController,
          networkController,
        );
      } else if (isEthSignTypedData(req)) {
        await handleEthSignTypedData(
          req,
          appStateController,
          networkController,
        );
      }
    } catch (error) {
      console.error('[createTrustSignalsMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

async function handleEthSendTransaction(
  req: JsonRpcRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
) {
  if (!hasValidTransactionParams(req)) {
    return;
  }

  const { to, data } = req.params[0];

  await scanAddressAndAddToCache(to, appStateController, networkController);

  if (data && typeof data === 'string') {
    const spenderAddress = extractSpenderFromApprovalTransaction(data);
    if (spenderAddress) {
      await scanAddressAndAddToCache(
        spenderAddress,
        appStateController,
        networkController,
      );
    }
  }
}

async function handleEthSignTypedData(
  req: JsonRpcRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
) {
  if (!hasValidTypedDataParams(req)) {
    return;
  }

  const typedDataMessage = parseTypedDataMessage(
    typeof req.params[1] === 'string'
      ? req.params[1]
      : JSON.stringify(req.params[1]),
  ) as ParsedTypedDataMessage;

  const verifyingContract = typedDataMessage.domain?.verifyingContract;
  if (verifyingContract) {
    await scanAddressAndAddToCache(
      verifyingContract,
      appStateController,
      networkController,
    );
  }

  const spenderAddress = extractSpenderFromPermitSignature(typedDataMessage);
  if (spenderAddress) {
    await scanAddressAndAddToCache(
      spenderAddress,
      appStateController,
      networkController,
    );
  }
}

/**
 * Extracts the spender address from an approval transaction.
 *
 * @param data - The transaction data to parse
 * @returns The spender address if found, null otherwise
 */
function extractSpenderFromApprovalTransaction(data: string): string | null {
  try {
    const parsedData = parseStandardTokenTransactionData(data);
    if (!parsedData) {
      return null;
    }

    const { name, args } = parsedData;

    // Check if this is an approval-related transaction
    const approvalMethods = [
      TransactionType.tokenMethodApprove,
      TransactionType.tokenMethodSetApprovalForAll,
      TransactionType.tokenMethodIncreaseAllowance,
    ];

    if (!approvalMethods.includes(name as TransactionType)) {
      return null;
    }

    // Extract spender address based on the method
    const spender =
      args?._spender ?? // ERC-20 approve
      args?._operator ?? // ERC-721/1155 setApprovalForAll
      args?.spender ?? // Fiat Token V2 increaseAllowance
      null;

    return spender;
  } catch (error) {
    console.error('[extractSpenderFromApprovalTransaction] error: ', error);
    return null;
  }
}

/**
 * Extracts the spender address from a permit signature (EIP-2612).
 *
 * @param typedDataMessage - The parsed typed data message
 * @returns The spender address if found, null otherwise
 */
function extractSpenderFromPermitSignature(
  typedDataMessage: ParsedTypedDataMessage,
): string | null {
  try {
    const { primaryType, message } = typedDataMessage;

    const permitTypes = ['Permit', 'PermitSingle', 'PermitBatch'];
    if (!permitTypes.includes(primaryType)) {
      return null;
    }

    // Extract spender address from the message
    const spender = message?.spender as string | undefined;
    return spender ?? null;
  } catch (error) {
    console.error('[extractSpenderFromPermitSignature] error: ', error);
    return null;
  }
}
