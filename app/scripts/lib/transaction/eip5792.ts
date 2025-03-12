import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  Log,
  TransactionController,
  TransactionControllerGetStateAction,
  TransactionReceipt,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { Messenger } from '@metamask/base-controller';
import {
  GetCallsStatusCode,
  GetCallsStatusResult,
  SendCalls,
  SendCallsResult,
} from '@metamask/eth-json-rpc-middleware';

type Actions =
  | NetworkControllerGetNetworkClientByIdAction
  | TransactionControllerGetStateAction;

export type EIP5792Messenger = Messenger<Actions, never>;

export async function processSendCalls(
  hooks: {
    addTransactionBatch: TransactionController['addTransactionBatch'];
    getDisabledAccountUpgradeChains: () => Hex[];
  },
  messenger: EIP5792Messenger,
  params: SendCalls,
  req: JsonRpcRequest & { networkClientId: string; origin?: string },
): Promise<SendCallsResult> {
  const { addTransactionBatch, getDisabledAccountUpgradeChains } = hooks;
  const { calls, capabilities, chainId: requestChainId, from } = params;
  const { networkClientId, origin } = req;
  const transactions = calls.map((call) => ({ params: call }));

  const dappChainId = messenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  ).configuration.chainId;

  if (
    requestChainId &&
    requestChainId.toLowerCase() !== dappChainId.toLowerCase()
  ) {
    throw rpcErrors.invalidInput(
      `Chain ID must match the dApp selected network: Got ${requestChainId}, expected ${dappChainId}`,
    );
  }

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

  const disabledChains = getDisabledAccountUpgradeChains();
  const isDisabled = disabledChains.includes(dappChainId);

  if (isDisabled) {
    throw rpcErrors.methodNotSupported(
      `EIP-5792 is not supported for this chain and account - Chain ID: ${dappChainId}, Account: ${from}`,
    );
  }

  const { batchId: id } = await addTransactionBatch({
    from,
    networkClientId,
    origin,
    transactions,
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

  const {
    chainId,
    hash,
    txReceipt: rawTxReceipt,
    status: transactionStatus,
  } = transactions[0];

  let status = GetCallsStatusCode.PENDING;

  if (transactionStatus === TransactionStatus.confirmed) {
    status = GetCallsStatusCode.CONFIRMED;
  } else if (transactionStatus === TransactionStatus.failed) {
    status = hash
      ? GetCallsStatusCode.REVERTED
      : GetCallsStatusCode.FAILED_OFFCHAIN;
  } else if (transactionStatus === TransactionStatus.dropped) {
    status = GetCallsStatusCode.REVERTED;
  }

  const txReceipt = rawTxReceipt as unknown as Required<TransactionReceipt> & {
    transactionHash: Hex;
  };

  const logs =
    (txReceipt.logs as (Required<Log> & {
      data: Hex;
    })[]) ?? [];

  const receipts: GetCallsStatusResult['receipts'] = [
    {
      blockHash: txReceipt.blockHash as Hex,
      blockNumber: txReceipt.blockNumber as Hex,
      gasUsed: txReceipt.gasUsed as Hex,
      logs: logs.map((log: Required<Log> & { data: Hex }) => ({
        address: log.address as Hex,
        data: log.data,
        topics: log.topics as unknown as Hex[],
      })),
      status: txReceipt.status as Hex,
      transactionHash: txReceipt.transactionHash,
    },
  ];

  return {
    version: '1.0',
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
