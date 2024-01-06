import { InternalAccount } from '@metamask/keyring-api';
import { Provider } from '@metamask/network-controller';
import {
  TransactionController,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import {
  AddUserOperationOptions,
  SmartContractAccount,
  UserOperationController,
} from '@metamask/user-operation-controller';
import { addHexPrefix } from 'ethereumjs-util';
import { SimpleSmartContractAccount } from 'simple-smart-contract-account';

export type AddTransactionOptions = NonNullable<
  Parameters<TransactionController['addTransaction']>[1]
>;

type BaseAddTransactionRequest = {
  networkClientId: string;
  provider: Provider;
  selectedAccount: InternalAccount;
  transactionParams: TransactionParams;
  transactionController: TransactionController;
  userOperationController: UserOperationController;
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
  const { id: actionId, method, origin, securityAlertResponse } = dappRequest;

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
  const { waitForSubmit } = request;

  const { transactionMeta, waitForHash } = await addTransactionOrUserOperation(
    request,
  );

  if (!waitForSubmit) {
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

  const isSmartContractAccount =
    process.env.EIP_4337_FORCE ?? selectedAccount.type === 'eip155:eip4337';

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
    provider,
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

  const smartContractAccount = await getSmartContractAccount(provider);

  const options: AddUserOperationOptions = {
    networkClientId,
    origin,
    requireApproval,
    smartContractAccount,
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

// Temporary until sample 4337 snap is available.
async function getSmartContractAccount(
  provider: Provider,
): Promise<SmartContractAccount> {
  return new SimpleSmartContractAccount({
    bundler: process.env.EIP_4337_BUNDLER as string,
    entrypoint: process.env.EIP_4337_ENTRYPOINT as string,
    owner: process.env.EIP_4337_SIMPLE_ACCOUNT_OWNER as string,
    privateKey: process.env.EIP_4337_SIMPLE_ACCOUNT_PRIVATE_KEY as string,
    provider: provider as any,
    salt: process.env.EIP_4337_SIMPLE_ACCOUNT_SALT as string,
    simpleAccountFactory: process.env.EIP_4337_SIMPLE_ACCOUNT_FACTORY as string,
  });
}
