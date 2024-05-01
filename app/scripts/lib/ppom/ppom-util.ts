import {
  SecurityAlertResponse,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { captureException } from '@sentry/browser';
import { v4 as uuid } from 'uuid';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';

const METHOD_SEND_TRANSACTION = 'eth_sendTransaction';

export type PPOMRequest = {
  method: string;
  params: unknown[];
};

export function normalizePPOMRequest(request: PPOMRequest) {
  if (request.method !== METHOD_SEND_TRANSACTION) {
    return request;
  }

  const transactionParams = (request.params?.[0] || {}) as TransactionParams;
  const normalizedParams = normalizeTransactionParams(transactionParams);

  return {
    ...request,
    params: [normalizedParams],
  };
}

export async function validateRequestWithPPOM({
  chainId,
  request,
}: {
  chainId: Hex;
  request: PPOMRequest;
}): Promise<SecurityAlertResponse> {
  const securityAlertId = uuid();

  const body = JSON.stringify(normalizePPOMRequest(request));

  console.log('Sending validation request', body);

  try {
    const response = await fetch(`http://localhost:3000/validate/${chainId}`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const securityAlertResponse = await response.json();
    securityAlertResponse.securityAlertId = securityAlertId;

    return securityAlertResponse;
  } catch (e) {
    captureException(e);

    const errorObject = e as unknown as Error;

    console.error('Error validating JSON RPC using PPOM: ', e);

    const securityAlertResponse = {
      securityAlertId,
      result_type: BlockaidResultType.Errored,
      reason: BlockaidReason.errored,
      description: `${errorObject.name}: ${errorObject.message}`,
    };

    return securityAlertResponse;
  }
}
