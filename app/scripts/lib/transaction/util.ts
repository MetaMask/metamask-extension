import { InternalAccount } from '@metamask/keyring-api';
import {
  TransactionController,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import {
  AddUserOperationOptions,
  UserOperationController,
} from '@metamask/user-operation-controller';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import { PPOMController } from '@metamask/ppom-validator';
import { captureException } from '@sentry/browser';
import { addHexPrefix } from 'ethereumjs-util';
import { SUPPORTED_CHAIN_IDS } from '../ppom/ppom-middleware';
///: END:ONLY_INCLUDE_IF

export type AddTransactionOptions = NonNullable<
  Parameters<TransactionController['addTransaction']>[1]
>;

type BaseAddTransactionRequest = {
  chainId: string;
  networkClientId: string;
  ppomController: PPOMController;
  securityAlertsEnabled: boolean;
  selectedAccount: InternalAccount;
  transactionParams: TransactionParams;
  transactionController: TransactionController;
  userOperationController: UserOperationController;
};

/**
 * Type for security alert response from transaction validator.
 */
export type SecurityAlertResponse = {
  reason: string;
  features?: string[];
  result_type: string;
  providerRequestsCount?: Record<string, number>;
};

type FinalAddTransactionRequest = BaseAddTransactionRequest & {
  transactionOptions: AddTransactionOptions;
};

export type AddTransactionRequest = FinalAddTransactionRequest & {
  waitForSubmit: boolean;
};

export type AddDappTransactionRequest = BaseAddTransactionRequest & {
  dappRequest: Record<string, any>;
};

export async function addDappTransaction(
  request: AddDappTransactionRequest,
): Promise<string> {
  const { dappRequest } = request;
  const { id: actionId, method, origin } = dappRequest;

  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  const { securityAlertResponse } = dappRequest;
  ///: END:ONLY_INCLUDE_IF

  const transactionOptions: AddTransactionOptions = {
    actionId,
    method,
    origin,
    // This is the default behaviour but specified here for clarity
    requireApproval: true,
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    securityAlertResponse,
    ///: END:ONLY_INCLUDE_IF
  };

  const { waitForHash } = await addTransactionOrUserOperation({
    ...request,
    transactionOptions,
  });

  return (await waitForHash()) as string;
}

export async function addTransaction(
  request: AddTransactionRequest,
): Promise<TransactionMeta> {
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  const {
    transactionParams,
    transactionOptions,
    ppomController,
    securityAlertsEnabled,
    chainId,
  } = request;

  if (securityAlertsEnabled && SUPPORTED_CHAIN_IDS.includes(chainId)) {
    try {
      const ppomRequest = {
        method: 'eth_sendTransaction',
        id: 'actionId' in transactionOptions ? transactionOptions.actionId : '',
        origin: 'origin' in transactionOptions ? transactionOptions.origin : '',
        params: [
          {
            from: transactionParams.from,
            to: transactionParams.to,
            value: transactionParams.value,
            data: transactionParams.data,
          },
        ],
      };

      const securityAlertResponse = await ppomController.usePPOM(
        async (ppom) => {
          return ppom.validateJsonRpc(ppomRequest);
        },
      );

      request.transactionOptions.securityAlertResponse = securityAlertResponse;
    } catch (e) {
      captureException(e);
    }
  }
  ///: END:ONLY_INCLUDE_IF

  const { transactionMeta, waitForHash } = await addTransactionOrUserOperation(
    request,
  );

  if (!request.waitForSubmit) {
    waitForHash().catch(() => {
      // Not concerned with result.
    });

    return transactionMeta as TransactionMeta;
  }

  const transactionHash = await waitForHash();

  const finalTransactionMeta = getTransactionByHash(
    transactionHash as string,
    request.transactionController,
  );

  return finalTransactionMeta as TransactionMeta;
}

async function addTransactionOrUserOperation(
  request: FinalAddTransactionRequest,
) {
  const { selectedAccount } = request;

  const isSmartContractAccount = selectedAccount.type === 'eip155:erc4337';

  if (isSmartContractAccount) {
    return addUserOperationWithController(request);
  }

  return addTransactionWithController(request);
}

async function addTransactionWithController(
  request: FinalAddTransactionRequest,
) {
  const { transactionController, transactionOptions, transactionParams } =
    request;
  const { result, transactionMeta } =
    await transactionController.addTransaction(
      transactionParams,
      transactionOptions,
    );

  return {
    transactionMeta,
    waitForHash: () => result,
  };
}

async function addUserOperationWithController(
  request: FinalAddTransactionRequest,
) {
  const {
    networkClientId,
    transactionController,
    transactionOptions,
    transactionParams,
    userOperationController,
  } = request;

  const { maxFeePerGas, maxPriorityFeePerGas } = transactionParams;
  const { origin, requireApproval, type } = transactionOptions as any;

  const normalisedTransaction: TransactionParams = {
    ...transactionParams,
    maxFeePerGas: addHexPrefix(maxFeePerGas as string),
    maxPriorityFeePerGas: addHexPrefix(maxPriorityFeePerGas as string),
  };

  const swaps = transactionOptions?.swaps?.meta;

  if (swaps?.type) {
    delete swaps.type;
  }

  const options: AddUserOperationOptions = {
    networkClientId,
    origin,
    requireApproval,
    swaps,
    type,
  } as any;

  const result = await userOperationController.addUserOperationFromTransaction(
    normalisedTransaction,
    options,
  );

  userOperationController.startPollingByNetworkClientId(networkClientId);

  const transactionMeta = getTransactionById(result.id, transactionController);

  return {
    transactionMeta,
    waitForHash: result.transactionHash,
  };
}

function getTransactionById(
  transactionId: string,
  transactionController: TransactionController,
) {
  return transactionController.state.transactions.find(
    (tx) => tx.id === transactionId,
  );
}

function getTransactionByHash(
  transactionHash: string,
  transactionController: TransactionController,
) {
  return transactionController.state.transactions.find(
    (tx) => tx.hash === transactionHash,
  );
}
