import {
  SecurityAlertResponse,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { captureException } from '@sentry/browser';
import { v4 as uuid } from 'uuid';
import { PPOMController } from '@metamask/ppom-validator';
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
  ppomController,
  isAPIEnabled,
}: {
  chainId: Hex;
  request: PPOMRequest;
  ppomController: PPOMController;
  isAPIEnabled: boolean;
}): Promise<SecurityAlertResponse> {
  const securityAlertId = uuid();
  const normalizedRequest = normalizePPOMRequest(request);

  try {
    if (isAPIEnabled) {
      return await validateWithAPI({ request: normalizedRequest, chainId });
    }

    return await validateWithController({
      ppomController,
      request: normalizedRequest,
    });
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

async function validateWithController({
  ppomController,
  request,
}: {
  ppomController: PPOMController;
  request: PPOMRequest;
}): Promise<SecurityAlertResponse> {
  return await ppomController.usePPOM<SecurityAlertResponse>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (ppom: any) => {
      return await ppom.validateJsonRpc(request);
    },
  );
}

async function validateWithAPI({
  request,
  chainId,
}: {
  request: PPOMRequest;
  chainId: Hex;
}): Promise<SecurityAlertResponse> {
  const body = JSON.stringify(request);

  console.log('Sending validation request', body);

  const response = await fetch(`http://localhost:3000/validate/${chainId}`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
}
