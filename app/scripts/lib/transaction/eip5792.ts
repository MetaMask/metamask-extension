import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  Log,
  TransactionController,
  TransactionControllerGetStateAction,
  TransactionMeta,
  TransactionReceipt,
  TransactionStatus,
  ValidateSecurityRequest,
} from '@metamask/transaction-controller';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { Messenger } from '@metamask/base-controller';
import {
  GetCallsStatusCode,
  GetCallsStatusResult,
  SendCalls,
  SendCallsResult,
} from '@metamask/eth-json-rpc-middleware';
import { generateSecurityAlertId } from '../ppom/ppom-util';

type Actions =
  | NetworkControllerGetNetworkClientByIdAction
  | TransactionControllerGetStateAction;

export type EIP5792Messenger = Messenger<Actions, never>;

const VERSION_SEND_CALLS = '1.0';
const VERSION_GET_CALLS_STATUS = '1.0';

export async function processSendCalls(
  hooks: {
    addTransactionBatch: TransactionController['addTransactionBatch'];
    getDisabledAccountUpgradeChains: () => Hex[];
    validateSecurity: (
      securityAlertId: string,
      request: ValidateSecurityRequest,
      chainId: Hex,
    ) => Promise<void>;
  },
  messenger: EIP5792Messenger,
  params: SendCalls,
  req: JsonRpcRequest & { networkClientId: string; origin?: string },
): Promise<SendCallsResult> {
  const {
    addTransactionBatch,
    getDisabledAccountUpgradeChains,
    validateSecurity: validateSecurityHook,
  } = hooks;

  const { calls, from } = params;
  const { networkClientId, origin } = req;
  const transactions = calls.map((call) => ({ params: call }));

  const dappChainId = messenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  ).configuration.chainId;

  const disabledChains = getDisabledAccountUpgradeChains();

  validateSendCalls(params, dappChainId, disabledChains);

  const securityAlertId = generateSecurityAlertId();
  const validateSecurity = validateSecurityHook.bind(null, securityAlertId);

  const { batchId: id } = await addTransactionBatch({
    from,
    networkClientId,
    origin,
    securityAlertId,
    transactions,
    validateSecurity,
  });

  return { id };
}

export function getCallsStatus(
  messenger: EIP5792Messenger,
  id: Hex,
): GetCallsStatusResult {
  const transactions = messenger
    .call('TransactionController:getState')
    .transactions.filter((tx) => tx.batchId === id);

  if (!transactions?.length) {
    throw rpcErrors.invalidInput(`No matching calls found`);
  }

  const transaction = transactions[0];
  const { chainId, txReceipt: rawTxReceipt } = transaction;
  const status = getStatusCode(transaction);
  const txReceipt = rawTxReceipt as Required<TransactionReceipt> | undefined;
  const logs = (txReceipt?.logs ?? []) as Required<Log>[];

  const receipts: GetCallsStatusResult['receipts'] = txReceipt && [
    {
      blockHash: txReceipt.blockHash as Hex,
      blockNumber: txReceipt.blockNumber as Hex,
      gasUsed: txReceipt.gasUsed as Hex,
      logs: logs.map((log: Required<Log> & { data: Hex }) => ({
        address: log.address as Hex,
        data: log.data,
        topics: log.topics as unknown as Hex[],
      })),
      status: txReceipt.status as '0x0' | '0x1',
      transactionHash: txReceipt.transactionHash,
    },
  ];

  return {
    version: VERSION_GET_CALLS_STATUS,
    id,
    chainId,
    status,
    receipts,
  };
}

export async function getCapabilities(_address: Hex, _chainIds?: Hex[]) {
  // No capabilities currently supported
  return {};
}

function validateSendCalls(
  sendCalls: SendCalls,
  dappChainId: Hex,
  disabledChains: Hex[],
) {
  validateSendCallsVersion(sendCalls);
  validateSendCallsChainId(sendCalls, dappChainId);
  validateCapabilities(sendCalls);
  validateUserDisabled(sendCalls, disabledChains, dappChainId);
}

function validateSendCallsVersion(sendCalls: SendCalls) {
  const { version } = sendCalls;

  if (version !== VERSION_SEND_CALLS) {
    throw rpcErrors.invalidInput(
      `Version not supported: Got ${version}, expected ${VERSION_SEND_CALLS}`,
    );
  }
}

function validateSendCallsChainId(sendCalls: SendCalls, dappChainId: Hex) {
  const { chainId: requestChainId } = sendCalls;

  if (
    requestChainId &&
    requestChainId.toLowerCase() !== dappChainId.toLowerCase()
  ) {
    throw rpcErrors.invalidInput(
      `Chain ID must match the dApp selected network: Got ${requestChainId}, expected ${dappChainId}`,
    );
  }
}

function validateCapabilities(sendCalls: SendCalls) {
  const { calls, capabilities } = sendCalls;

  const requiredTopLevelCapabilities = Object.keys(capabilities ?? {}).filter(
    (name) => capabilities?.[name].optional !== true,
  );

  const requiredCallCapabilities = calls.flatMap((call) =>
    Object.keys(call.capabilities ?? {}).filter(
      (name) => call.capabilities?.[name].optional !== true,
    ),
  );

  const requiredCapabilities = [
    ...requiredTopLevelCapabilities,
    ...requiredCallCapabilities,
  ];

  if (requiredCapabilities?.length) {
    throw rpcErrors.invalidInput(
      `Unsupported non-optional capabilities: ${requiredCapabilities.join(
        ', ',
      )}`,
    );
  }
}

function validateUserDisabled(
  sendCalls: SendCalls,
  disabledChains: Hex[],
  dappChainId: Hex,
) {
  const { from } = sendCalls;
  const isDisabled = disabledChains.includes(dappChainId);

  if (isDisabled) {
    throw rpcErrors.methodNotSupported(
      `EIP-5792 is not supported for this chain and account - Chain ID: ${dappChainId}, Account: ${from}`,
    );
  }
}

function getStatusCode(transactionMeta: TransactionMeta) {
  const { hash, status } = transactionMeta;

  if (status === TransactionStatus.confirmed) {
    return GetCallsStatusCode.CONFIRMED;
  }

  if (status === TransactionStatus.failed) {
    return hash
      ? GetCallsStatusCode.REVERTED
      : GetCallsStatusCode.FAILED_OFFCHAIN;
  }

  if (status === TransactionStatus.dropped) {
    return GetCallsStatusCode.REVERTED;
  }

  return GetCallsStatusCode.PENDING;
}
