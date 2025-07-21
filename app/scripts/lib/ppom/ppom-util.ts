import { PPOMController } from '@metamask/ppom-validator';
import {
  TransactionController,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionMeta,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import { Hex, JsonRpcRequest, createProjectLogger } from '@metamask/utils';
import { v4 as uuid } from 'uuid';
import { PPOM } from '@blockaid/ppom_release';
import {
  SignatureController,
  SignatureControllerState,
  SignatureRequest,
  SignatureStateChange,
} from '@metamask/signature-controller';
import { Messenger } from '@metamask/base-controller';
import { cloneDeep } from 'lodash';
import {
  BlockaidReason,
  BlockaidResultType,
  LOADING_SECURITY_ALERT_RESPONSE,
  SecurityAlertSource,
} from '../../../../shared/constants/security-provider';
import { SIGNING_METHODS } from '../../../../shared/constants/transaction';
import { AppStateController } from '../../controllers/app-state-controller';
import { sanitizeMessageRecursively } from '../../../../shared/modules/typed-signature';
import { parseTypedDataMessage } from '../../../../shared/modules/transaction.utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { SecurityAlertResponse, UpdateSecurityAlertResponse } from './types';
import {
  isSecurityAlertsAPIEnabled,
  SecurityAlertsAPIRequest,
  validateWithSecurityAlertsAPI,
} from './security-alerts-api';

const log = createProjectLogger('ppom-util');

const { sentry } = global;

const SECURITY_ALERT_RESPONSE_ERROR = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: BlockaidResultType.Errored,
  reason: BlockaidReason.errored,
};

type PPOMRequest = JsonRpcRequest & {
  delegationMock?: Hex;
  origin?: string;
};

export type PPOMMessenger = Messenger<
  never,
  SignatureStateChange | TransactionControllerUnapprovedTransactionAddedEvent
>;

export async function validateRequestWithPPOM({
  ppomController,
  request,
  securityAlertId,
  chainId,
  updateSecurityAlertResponse: updateSecurityResponse,
}: {
  ppomController: PPOMController;
  request: PPOMRequest;
  securityAlertId: string;
  chainId: Hex;
  updateSecurityAlertResponse: UpdateSecurityAlertResponse;
}) {
  try {
    const controllerObject = await updateSecurityResponse(
      request.method,
      securityAlertId,
      LOADING_SECURITY_ALERT_RESPONSE,
    );

    const normalizedRequest = normalizePPOMRequest(request, controllerObject);

    log('Normalized request', normalizedRequest);

    const ppomResponse = isSecurityAlertsAPIEnabled()
      ? await validateWithAPI(ppomController, chainId, normalizedRequest)
      : await validateWithController(
          ppomController,
          normalizedRequest,
          chainId,
        );

    await updateSecurityResponse(request.method, securityAlertId, ppomResponse);
  } catch (error: unknown) {
    log('Error', error);

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
  messenger,
  method,
  securityAlertId,
  securityAlertResponse,
  signatureController,
  transactionController,
}: {
  appStateController: AppStateController;
  messenger: PPOMMessenger;
  method: string;
  securityAlertId: string;
  securityAlertResponse: SecurityAlertResponse;
  signatureController: SignatureController;
  transactionController: TransactionController;
}): Promise<TransactionMeta | SignatureRequest> {
  const isSignatureRequest = SIGNING_METHODS.includes(method);

  if (isSignatureRequest) {
    const signatureRequest = await waitForSignatureRequest(
      signatureController,
      securityAlertId,
      messenger,
    );

    appStateController.addSignatureSecurityAlertResponse({
      ...securityAlertResponse,
      securityAlertId,
    });

    return signatureRequest;
  }

  const transactionMeta = await waitForTransactionMetadata(
    transactionController,
    securityAlertId,
    messenger,
  );

  transactionController.updateSecurityAlertResponse(transactionMeta.id, {
    ...securityAlertResponse,
    securityAlertId,
  } as SecurityAlertResponse);

  return transactionMeta;
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

function normalizePPOMRequest(
  request: PPOMRequest,
  controllerObject: TransactionMeta | SignatureRequest,
): PPOMRequest {
  let normalizedRequest = cloneDeep(request);

  normalizedRequest = normalizeSignatureRequest(normalizedRequest);

  normalizedRequest = normalizeTransactionRequest(
    normalizedRequest,
    controllerObject as TransactionMeta,
  );

  const { delegationMock, id, jsonrpc, method, origin, params } =
    normalizedRequest;

  return {
    delegationMock,
    id,
    jsonrpc,
    method,
    origin,
    params,
  };
}

function normalizeTransactionRequest(
  request: PPOMRequest,
  transactionMeta: TransactionMeta,
): PPOMRequest {
  if (request.method !== MESSAGE_TYPE.ETH_SEND_TRANSACTION) {
    return request;
  }

  if (!Array.isArray(request.params) || !request.params[0]) {
    return request;
  }

  const txParams = request.params[0] as TransactionParams;

  txParams.gas = transactionMeta.txParams.gas;
  txParams.gasPrice =
    transactionMeta.txParams.maxFeePerGas ?? transactionMeta.txParams.gasPrice;

  delete txParams.gasLimit;
  delete txParams.maxFeePerGas;
  delete txParams.maxPriorityFeePerGas;
  delete txParams.type;

  const normalizedParams = normalizeTransactionParams(txParams);

  log('Normalized transaction params', normalizedParams);

  return {
    ...request,
    params: [normalizedParams],
  };
}

function normalizeSignatureRequest(request: PPOMRequest): PPOMRequest {
  // This is a temporary fix to prevent a PPOM bypass
  if (
    request.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 &&
    request.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  ) {
    return request;
  }

  if (!Array.isArray(request.params) || !request.params[1]) {
    return request;
  }

  const typedDataMessage = parseTypedDataMessage(request.params[1].toString());

  const sanitizedMessageRecursively = sanitizeMessageRecursively(
    typedDataMessage.message,
    typedDataMessage.types,
    typedDataMessage.primaryType,
  );

  return {
    ...request,
    params: [
      request.params[0],
      JSON.stringify({
        ...typedDataMessage,
        message: sanitizedMessageRecursively,
      }),
    ],
  };
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

async function validateWithController(
  ppomController: PPOMController,
  request: SecurityAlertsAPIRequest | PPOMRequest,
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
  request: SecurityAlertsAPIRequest | PPOMRequest,
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

async function waitForTransactionMetadata(
  transactionController: TransactionController,
  securityAlertId: string,
  messenger: PPOMMessenger,
): Promise<TransactionMeta> {
  const transactionFilter = (meta: TransactionMeta) =>
    meta.securityAlertResponse?.securityAlertId === securityAlertId;

  return new Promise((resolve) => {
    const transactionMeta =
      transactionController.state.transactions.find(transactionFilter);

    if (transactionMeta) {
      resolve(transactionMeta);
      return;
    }

    const callback = (event: TransactionMeta) => {
      if (!transactionFilter(event)) {
        return;
      }

      log('Found transaction metadata', event);

      messenger.unsubscribe(
        'TransactionController:unapprovedTransactionAdded',
        callback,
      );

      resolve(event);
    };

    log('Waiting for transaction metadata', securityAlertId);

    messenger.subscribe(
      'TransactionController:unapprovedTransactionAdded',
      callback,
    );
  });
}

async function waitForSignatureRequest(
  signatureController: SignatureController,
  securityAlertId: string,
  messenger: PPOMMessenger,
): Promise<SignatureRequest> {
  const signatureFilter = (state: SignatureControllerState) =>
    Object.values(state.signatureRequests).find(
      (request) =>
        request.securityAlertResponse?.securityAlertId === securityAlertId,
    );

  return new Promise((resolve) => {
    const signatureRequest = signatureFilter(signatureController.state);

    if (signatureRequest) {
      resolve(signatureRequest);
      return;
    }

    const callback = (state: SignatureControllerState) => {
      const request = signatureFilter(state);

      if (!request) {
        return;
      }

      log('Found signature request', request);

      messenger.unsubscribe('SignatureController:stateChange', callback);

      resolve(request);
    };

    log('Waiting for signature request', securityAlertId);

    messenger.subscribe('SignatureController:stateChange', callback);
  });
}
