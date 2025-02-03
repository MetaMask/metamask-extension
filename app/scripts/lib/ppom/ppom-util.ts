import { PPOMController } from '@metamask/ppom-validator';
import {
  TransactionController,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { v4 as uuid } from 'uuid';
import { PPOM } from '@blockaid/ppom_release';
import { SignatureController } from '@metamask/signature-controller';
import {
  BlockaidReason,
  BlockaidResultType,
  LOADING_SECURITY_ALERT_RESPONSE,
  SECURITY_ALERT_RESPONSE_CHAIN_NOT_SUPPORTED,
  SECURITY_PROVIDER_SUPPORTED_CHAIN_IDS_FALLBACK_LIST,
  SecurityAlertSource,
} from '../../../../shared/constants/security-provider';
import { SIGNING_METHODS } from '../../../../shared/constants/transaction';
import { AppStateController } from '../../controllers/app-state-controller';
import { SecurityAlertResponse, UpdateSecurityAlertResponse } from './types';
import {
  getSecurityAlertsAPISupportedChainIds,
  isSecurityAlertsAPIEnabled,
  SecurityAlertsAPIRequest,
  validateWithSecurityAlertsAPI,
} from './security-alerts-api';

const { sentry } = global;

const METHOD_SEND_TRANSACTION = 'eth_sendTransaction';
export const METHOD_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3';
export const METHOD_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4';

const SECURITY_ALERT_RESPONSE_ERROR = {
  result_type: BlockaidResultType.Errored,
  reason: BlockaidReason.errored,
};

type PPOMRequest = Omit<JsonRpcRequest, 'method' | 'params'> & {
  method: typeof METHOD_SEND_TRANSACTION;
  params: [TransactionParams];
};

export async function validateRequestWithPPOM({
  ppomController,
  request,
  securityAlertId,
  chainId,
  updateSecurityAlertResponse: updateSecurityResponse,
}: {
  ppomController: PPOMController;
  request: JsonRpcRequest;
  securityAlertId: string;
  chainId: Hex;
  updateSecurityAlertResponse: UpdateSecurityAlertResponse;
}) {
  try {
    if (!(await isChainSupported(chainId))) {
      await updateSecurityResponse(
        request.method,
        securityAlertId,
        SECURITY_ALERT_RESPONSE_CHAIN_NOT_SUPPORTED,
      );
      return;
    }

    await updateSecurityResponse(
      request.method,
      securityAlertId,
      LOADING_SECURITY_ALERT_RESPONSE,
    );

    const normalizedRequest = normalizePPOMRequest(request);

    const ppomResponse = isSecurityAlertsAPIEnabled()
      ? await validateWithAPI(ppomController, chainId, normalizedRequest)
      : await validateWithController(
          ppomController,
          normalizedRequest,
          chainId,
        );
    await updateSecurityResponse(request.method, securityAlertId, ppomResponse);
  } catch (error: unknown) {
    await updateSecurityResponse(
      request.method,
      securityAlertId,
      handlePPOMError(error, 'Error validating JSON RPC using PPOM: '),
    );
  }
}

export function generateSecurityAlertId(): string {
  return uuid();
}

export async function updateSecurityAlertResponse({
  appStateController,
  method,
  securityAlertId,
  securityAlertResponse,
  signatureController,
  transactionController,
}: {
  appStateController: AppStateController;
  method: string;
  securityAlertId: string;
  securityAlertResponse: SecurityAlertResponse;
  signatureController: SignatureController;
  transactionController: TransactionController;
}) {
  const isSignatureRequest = SIGNING_METHODS.includes(method);

  const confirmation = await findConfirmationBySecurityAlertId(
    securityAlertId,
    method,
    signatureController,
    transactionController,
  );

  if (isSignatureRequest) {
    appStateController.addSignatureSecurityAlertResponse({
      ...securityAlertResponse,
      securityAlertId,
    });
  } else {
    transactionController.updateSecurityAlertResponse(confirmation.id, {
      ...securityAlertResponse,
      securityAlertId,
    } as SecurityAlertResponse);
  }
}

export function handlePPOMError(
  error: unknown,
  logMessage: string,
  source: SecurityAlertSource = SecurityAlertSource.API,
): SecurityAlertResponse {
  const errorData = getErrorData(error);
  const description = getErrorMessage(error);

  if (source === SecurityAlertSource.Local) {
    sentry?.captureException(error);
  }
  console.error(logMessage, errorData);

  return {
    ...SECURITY_ALERT_RESPONSE_ERROR,
    description,
    source,
  };
}

export async function isChainSupported(chainId: Hex): Promise<boolean> {
  let supportedChainIds = SECURITY_PROVIDER_SUPPORTED_CHAIN_IDS_FALLBACK_LIST;

  try {
    if (isSecurityAlertsAPIEnabled()) {
      supportedChainIds = await getSecurityAlertsAPISupportedChainIds();
    }
  } catch (error: unknown) {
    handlePPOMError(
      error,
      `Error fetching supported chains from security alerts API`,
    );
  }
  return supportedChainIds.includes(chainId as Hex);
}

function normalizePPOMRequest(
  request: PPOMRequest | JsonRpcRequest,
): PPOMRequest | JsonRpcRequest {
  if (
    !((req): req is PPOMRequest => req.method === METHOD_SEND_TRANSACTION)(
      request,
    )
  ) {
    return sanitizeRequest(request);
  }

  const transactionParams = request.params[0];
  const normalizedParams = normalizeTransactionParams(transactionParams);

  return {
    ...request,
    params: [normalizedParams],
  };
}

function sanitizeRequest(request: JsonRpcRequest): JsonRpcRequest {
  // This is a temporary fix to prevent a PPOM bypass
  if (
    request.method === METHOD_SIGN_TYPED_DATA_V4 ||
    request.method === METHOD_SIGN_TYPED_DATA_V3
  ) {
    if (Array.isArray(request.params)) {
      return {
        ...request,
        params: request.params.slice(0, 2),
      };
    }
  }
  return request;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return JSON.stringify(error);
}

function getErrorData(error: unknown) {
  if (typeof error === 'object' || typeof error === 'string') {
    return error;
  }

  return JSON.stringify(error);
}

async function findConfirmationBySecurityAlertId(
  securityAlertId: string,
  method: string,
  signatureController: SignatureController,
  transactionController: TransactionController,
) {
  const isSignatureRequest = SIGNING_METHODS.includes(method);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let confirmation;

    if (isSignatureRequest) {
      confirmation = Object.values(signatureController.messages).find(
        (message) =>
          message.securityAlertResponse?.securityAlertId === securityAlertId,
      );
    } else {
      confirmation = transactionController.state.transactions.find(
        (meta) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (meta.securityAlertResponse as any)?.securityAlertId ===
          securityAlertId,
      );
    }

    if (confirmation) {
      return confirmation;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function validateWithController(
  ppomController: PPOMController,
  request: SecurityAlertsAPIRequest | JsonRpcRequest,
  chainId: string,
): Promise<SecurityAlertResponse> {
  try {
    const response = (await ppomController.usePPOM(
      (ppom: PPOM) => ppom.validateJsonRpc(request),
      chainId,
    )) as SecurityAlertResponse;

    return {
      ...response,
      source: SecurityAlertSource.Local,
    };
  } catch (error: unknown) {
    return handlePPOMError(
      error,
      `Error validating request with PPOM controller`,
      SecurityAlertSource.Local,
    );
  }
}

async function validateWithAPI(
  ppomController: PPOMController,
  chainId: string,
  request: SecurityAlertsAPIRequest | JsonRpcRequest,
): Promise<SecurityAlertResponse> {
  try {
    const response = await validateWithSecurityAlertsAPI(chainId, request);

    return {
      ...response,
      source: SecurityAlertSource.API,
    };
  } catch (error: unknown) {
    handlePPOMError(error, `Error validating request with security alerts API`);
    return await validateWithController(ppomController, request, chainId);
  }
}
