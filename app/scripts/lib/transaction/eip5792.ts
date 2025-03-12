import { SendCalls } from '@metamask/eth-json-rpc-middleware/dist/methods/wallet-send-calls';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  TransactionController,
  TransactionControllerGetStateAction,
} from '@metamask/transaction-controller';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { Messenger } from '@metamask/base-controller';

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
) {
  const { addTransactionBatch, getDisabledAccountUpgradeChains } = hooks;
  const { calls, chainId: requestChainId, from } = params;
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

  const disabledChains = getDisabledAccountUpgradeChains();
  const isDisabled = disabledChains.includes(dappChainId);

  if (isDisabled) {
    throw rpcErrors.methodNotSupported(
      `EIP-5792 is not supported for this chain and account - Chain ID: ${dappChainId}, Account: ${from}`,
    );
  }

  const result = await addTransactionBatch({
    from,
    networkClientId,
    origin,
    transactions,
  });

  return result.batchId;
}

export function getTransactionReceiptsByBatchId(
  messenger: EIP5792Messenger,
  batchId: string,
) {
  return messenger
    .call('TransactionController:getState')
    .transactions.filter((tx) => tx.id === batchId)
    .map((tx) => tx.txReceipt);
}

export async function getCapabilities(
  hooks: {
    getDisabledAccountUpgradeChains: () => Hex[];
    isAtomicBatchSupported: (address: Hex) => Promise<Hex[]>;
  },
  address: Hex,
) {
  const { getDisabledAccountUpgradeChains, isAtomicBatchSupported } = hooks;

  const atomicBatchChains = await isAtomicBatchSupported(address);
  const disabledChains = getDisabledAccountUpgradeChains();

  return atomicBatchChains
    .filter((chainId) => !disabledChains.includes(chainId))
    .reduce(
      (acc, chainId) => ({
        ...acc,
        [chainId]: {
          atomicBatch: {
            supported: true,
          },
        },
      }),
      {},
    );
}
