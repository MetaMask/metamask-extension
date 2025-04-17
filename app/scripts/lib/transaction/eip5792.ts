import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import { JsonRpcError, rpcErrors } from '@metamask/rpc-errors';
import {
  IsAtomicBatchSupportedResultEntry,
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
  GetCapabilitiesResult,
  SendCalls,
  SendCallsResult,
} from '@metamask/eth-json-rpc-middleware';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { generateSecurityAlertId } from '../ppom/ppom-util';
import { EIP5792ErrorCode } from '../../../../shared/constants/transaction';

type Actions =
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetNetworkClientByIdAction
  | TransactionControllerGetStateAction;

export type EIP5792Messenger = Messenger<Actions, never>;

export enum AtomicCapabilityStatus {
  Supported = 'supported',
  Ready = 'ready',
  Unsupported = 'unsupported',
}

const VERSION = '2.0.0';

export async function processSendCalls(
  hooks: {
    addTransactionBatch: TransactionController['addTransactionBatch'];
    getDisabledUpgradeAccountsByChain: () => Record<Hex, Hex[]>;
    getDismissSmartAccountSuggestionEnabled: () => boolean;
    isAtomicBatchSupported: TransactionController['isAtomicBatchSupported'];
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
    getDisabledUpgradeAccountsByChain,
    getDismissSmartAccountSuggestionEnabled,
    isAtomicBatchSupported,
    validateSecurity: validateSecurityHook,
  } = hooks;

  const { calls, from: paramFrom } = params;
  const { networkClientId, origin } = req;
  const transactions = calls.map((call) => ({ params: call }));

  const dappChainId = messenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  ).configuration.chainId;

  const from =
    paramFrom ??
    (messenger.call('AccountsController:getSelectedAccount').address as Hex);

  const disabledUpgradeAccountsByChain = getDisabledUpgradeAccountsByChain();

  const dismissSmartAccountSuggestionEnabled =
    getDismissSmartAccountSuggestionEnabled();

  const batchSupport = await isAtomicBatchSupported({
    address: from,
    chainIds: [dappChainId],
  });

  const chainBatchSupport = batchSupport?.[0];

  validateSendCalls(
    params,
    from,
    dappChainId,
    disabledUpgradeAccountsByChain,
    dismissSmartAccountSuggestionEnabled,
    chainBatchSupport,
  );

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
    throw new JsonRpcError(
      EIP5792ErrorCode.UnknownBundleId,
      `No matching bundle found`,
    );
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
    version: VERSION,
    id,
    chainId,
    atomic: true, // Always atomic as we currently only support EIP-7702 batches
    status,
    receipts,
  };
}

export async function getCapabilities(
  hooks: {
    getDisabledUpgradeAccountsByChain: () => Record<Hex, Hex[]>;
    getDismissSmartAccountSuggestionEnabled: () => boolean;
    isAtomicBatchSupported: TransactionController['isAtomicBatchSupported'];
  },
  address: Hex,
  chainIds: Hex[] | undefined,
) {
  const {
    getDisabledUpgradeAccountsByChain,
    getDismissSmartAccountSuggestionEnabled,
    isAtomicBatchSupported,
  } = hooks;

  const addressNormalized = address.toLowerCase() as Hex;

  const chainIdsNormalized = chainIds?.map(
    (chainId) => chainId.toLowerCase() as Hex,
  );

  const batchSupport = await isAtomicBatchSupported({
    address,
    chainIds: chainIdsNormalized,
  });

  return batchSupport.reduce<GetCapabilitiesResult>(
    (acc, chainBatchSupport) => {
      const { chainId } = chainBatchSupport;

      const { delegationAddress, isSupported, upgradeContractAddress } =
        chainBatchSupport;

      const isUpgradeDisabled =
        getDisabledUpgradeAccountsByChain()?.[chainId]?.includes(
          addressNormalized,
        ) || getDismissSmartAccountSuggestionEnabled();

      const canUpgrade =
        !isUpgradeDisabled && upgradeContractAddress && !delegationAddress;

      if (!isSupported && !canUpgrade) {
        return acc;
      }

      const status = isSupported
        ? AtomicCapabilityStatus.Supported
        : AtomicCapabilityStatus.Ready;

      acc[chainId as Hex] = {
        atomic: {
          status,
        },
      };

      return acc;
    },
    {},
  );
}

function validateSendCalls(
  sendCalls: SendCalls,
  from: Hex,
  dappChainId: Hex,
  disabledUpgradeAccountsByChain: Record<Hex, Hex[]>,
  dismissSmartAccountSuggestionEnabled: boolean,
  chainBatchSupport: IsAtomicBatchSupportedResultEntry | undefined,
) {
  validateSendCallsVersion(sendCalls);
  validateSendCallsChainId(sendCalls, dappChainId, chainBatchSupport);
  validateCapabilities(sendCalls);

  validateUserDisabled(
    from,
    disabledUpgradeAccountsByChain,
    dappChainId,
    dismissSmartAccountSuggestionEnabled,
    chainBatchSupport,
  );
}

function validateSendCallsVersion(sendCalls: SendCalls) {
  const { version } = sendCalls;

  if (version !== VERSION) {
    throw rpcErrors.invalidInput(
      `Version not supported: Got ${version}, expected ${VERSION}`,
    );
  }
}

function validateSendCallsChainId(
  sendCalls: SendCalls,
  dappChainId: Hex,
  chainBatchSupport: IsAtomicBatchSupportedResultEntry | undefined,
) {
  const { chainId: requestChainId } = sendCalls;

  if (
    requestChainId &&
    requestChainId.toLowerCase() !== dappChainId.toLowerCase()
  ) {
    throw rpcErrors.invalidParams(
      `Chain ID must match the dApp selected network: Got ${requestChainId}, expected ${dappChainId}`,
    );
  }

  if (!chainBatchSupport) {
    throw new JsonRpcError(
      EIP5792ErrorCode.UnsupportedChainId,
      `EIP-7702 not supported on chain: ${dappChainId}`,
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
    throw new JsonRpcError(
      EIP5792ErrorCode.UnsupportedNonOptionalCapability,
      `Unsupported non-optional capabilities: ${requiredCapabilities.join(
        ', ',
      )}`,
    );
  }
}

function validateUserDisabled(
  from: Hex,
  disabledUpgradeAccountsByChain: Record<Hex, Hex[]>,
  dappChainId: Hex,
  dismissSmartAccountSuggestionEnabled: boolean,
  chainBatchSupport: IsAtomicBatchSupportedResultEntry | undefined,
) {
  const addressLowerCase = from.toLowerCase() as Hex;

  if (chainBatchSupport?.delegationAddress) {
    return;
  }

  const isDisabled =
    disabledUpgradeAccountsByChain[dappChainId]?.includes(addressLowerCase);

  if (isDisabled || dismissSmartAccountSuggestionEnabled) {
    throw new JsonRpcError(
      EIP5792ErrorCode.RejectedUpgrade,
      `EIP-7702 upgrade rejected for this chain and account - Chain ID: ${dappChainId}, Account: ${from}`,
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
