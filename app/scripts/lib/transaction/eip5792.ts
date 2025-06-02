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
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
} from '@metamask/accounts-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { generateSecurityAlertId } from '../ppom/ppom-util';
import { EIP5792ErrorCode } from '../../../../shared/constants/transaction';

type Actions =
  | AccountsControllerGetStateAction
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
const SUPPORTED_KEYRING_TYPES = [KeyringTypes.hd, KeyringTypes.simple];

export async function processSendCalls(
  hooks: {
    addTransactionBatch: TransactionController['addTransactionBatch'];
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

  const dismissSmartAccountSuggestionEnabled =
    getDismissSmartAccountSuggestionEnabled();

  const batchSupport = await isAtomicBatchSupported({
    address: from,
    chainIds: [dappChainId],
  });

  const chainBatchSupport = batchSupport?.[0];
  const keyringType = getAccountKeyringType(from, messenger);

  validateSendCalls(
    params,
    dappChainId,
    dismissSmartAccountSuggestionEnabled,
    chainBatchSupport,
    keyringType,
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
    getDismissSmartAccountSuggestionEnabled: () => boolean;
    isAtomicBatchSupported: TransactionController['isAtomicBatchSupported'];
  },
  messenger: EIP5792Messenger,
  address: Hex,
  chainIds: Hex[] | undefined,
) {
  const { getDismissSmartAccountSuggestionEnabled, isAtomicBatchSupported } =
    hooks;

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

      const isUpgradeDisabled = getDismissSmartAccountSuggestionEnabled();
      let isSupportedAccount = false;

      try {
        const keyringType = getAccountKeyringType(address, messenger);
        isSupportedAccount = SUPPORTED_KEYRING_TYPES.includes(keyringType);
      } catch (error) {
        // Intentionally empty
      }

      const canUpgrade =
        !isUpgradeDisabled &&
        upgradeContractAddress &&
        !delegationAddress &&
        isSupportedAccount;

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
  dappChainId: Hex,
  dismissSmartAccountSuggestionEnabled: boolean,
  chainBatchSupport: IsAtomicBatchSupportedResultEntry | undefined,
  keyringType: KeyringTypes,
) {
  validateSendCallsVersion(sendCalls);
  validateSendCallsChainId(sendCalls, dappChainId, chainBatchSupport);
  validateCapabilities(sendCalls);
  validateUpgrade(
    dismissSmartAccountSuggestionEnabled,
    chainBatchSupport,
    keyringType,
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

function validateUpgrade(
  dismissSmartAccountSuggestionEnabled: boolean,
  chainBatchSupport: IsAtomicBatchSupportedResultEntry | undefined,
  keyringType: KeyringTypes,
) {
  if (chainBatchSupport?.delegationAddress) {
    return;
  }

  if (dismissSmartAccountSuggestionEnabled) {
    throw new JsonRpcError(
      EIP5792ErrorCode.RejectedUpgrade,
      'EIP-7702 upgrade disabled by the user',
    );
  }

  if (!SUPPORTED_KEYRING_TYPES.includes(keyringType)) {
    throw new JsonRpcError(
      EIP5792ErrorCode.RejectedUpgrade,
      'EIP-7702 upgrade not supported on account',
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

function getAccountKeyringType(
  accountAddress: Hex,
  messenger: EIP5792Messenger,
): KeyringTypes {
  const { accounts } = messenger.call(
    'AccountsController:getState',
  ).internalAccounts;

  const account = Object.values(accounts).find(
    (acc) => acc.address.toLowerCase() === accountAddress.toLowerCase(),
  );

  const keyringType = account?.metadata?.keyring?.type;

  if (!keyringType) {
    throw new JsonRpcError(
      EIP5792ErrorCode.RejectedUpgrade,
      'EIP-7702 upgrade not supported as account type is unknown',
    );
  }

  return keyringType as KeyringTypes;
}
