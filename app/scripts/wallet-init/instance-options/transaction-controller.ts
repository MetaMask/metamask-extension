import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  getAccountAddressRelationship,
  GasFeeEstimateLevel,
  SavedGasFees,
  TransactionController,
  TransactionMeta,
  TransactionType,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { WalletOptions } from '@metamask/wallet';
import { traceAsControllerCallback } from '../../../../shared/lib/trace';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import { getIsSmartTransaction } from '../../../../shared/lib/selectors';
import { getShieldGatewayConfig } from '../../../../shared/lib/shield';
import type {
  TransactionMetaEventPayload,
  TransactionMetricsRequest,
} from '../../../../shared/types/metametrics';
import {
  handlePostTransactionBalanceUpdate,
  handleTransactionAdded,
  handleTransactionApproved,
  handleTransactionConfirmed,
  handleTransactionDropped,
  handleTransactionFailed,
  handleTransactionRejected,
  handleTransactionSubmitted,
} from '../../lib/transaction/metrics';
import { isSendBundleSupported } from '../../lib/transaction/sentinel-api';
import { accountSupports7702 } from '../../lib/account-supports-7702';
import { MessengerClientFlatState } from '../../messenger-client-init/controller-list';
import { getTransactionControllerHooks } from '../../lib/transaction/hooks';
import { TransactionControllerInitMessenger } from '../messengers/transaction-controller-messenger';

type TransactionControllerInstanceOptions = NonNullable<
  NonNullable<WalletOptions['instanceOptions']>['transactionController']
>;

type CheckFirstTimeInteractionRequest = {
  chainId: number;
  from: string;
  to: string;
};

type GetTransactionControllerInstanceOptionsRequest = {
  initMessenger: TransactionControllerInitMessenger;
  getFlatState: () => MessengerClientFlatState;
  getPermittedAccounts: (origin?: string) => string[] | Promise<string[]>;
  getTransactionMetricsRequest: () => TransactionMetricsRequest;
};

type SetupTransactionControllerListenersRequest = {
  getTransactionMetricsRequest: () => TransactionMetricsRequest;
  messenger: TransactionControllerInitMessenger;
};

const DISABLED_AUTOMATIC_GAS_FEE_UPDATE_TYPES = [
  TransactionType.swap,
  TransactionType.swapApproval,
  TransactionType.bridge,
  TransactionType.bridgeApproval,
  TransactionType.relayDeposit,
  TransactionType.perpsRelayDeposit,
  TransactionType.predictRelayDeposit,
];

export function getTransactionControllerInstanceOptions({
  initMessenger,
  getFlatState,
  getPermittedAccounts,
  getTransactionMetricsRequest,
}: GetTransactionControllerInstanceOptionsRequest): TransactionControllerInstanceOptions {
  return {
    disableSwaps: false,
    getPermittedAccounts: async (origin?: string) =>
      getPermittedAccounts(origin),
    getSavedGasFees: getSavedGasFees.bind(null, {
      messenger: initMessenger,
    }),
    getSimulationConfig: getSimulationConfig.bind(null, {
      messenger: initMessenger,
    }),
    hooks: getTransactionControllerHooks({
      getFlatState,
      getTransactionMetricsRequest,
      messenger: initMessenger,
    }),
    isAutomaticGasFeeUpdateEnabled,
    isEIP7702GasFeeTokensEnabled: isEIP7702GasFeeTokensEnabled.bind(null, {
      getFlatState,
      messenger: initMessenger,
    }),
    isFirstTimeInteractionEnabled: () =>
      initMessenger.call('PreferencesController:getState')
        .securityAlertsEnabled,
    isSimulationEnabled: () =>
      initMessenger.call('PreferencesController:getState')
        .useTransactionSimulations,
    publicKeyEIP7702: process.env.EIP_7702_PUBLIC_KEY as Hex | undefined,
    testGasFeeFlows: Boolean(process.env.TEST_GAS_FEE_FLOWS === 'true'),
    trace: traceAsControllerCallback,
  };
}

export function setupTransactionControllerListeners({
  getTransactionMetricsRequest,
  messenger,
}: SetupTransactionControllerListenersRequest) {
  messenger.subscribe(
    'TransactionController:postTransactionBalanceUpdated',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handlePostTransactionBalanceUpdate(
        getTransactionMetricsRequest(),
        ...args,
      ),
  );

  messenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (transactionMeta) =>
      handleTransactionAdded(getTransactionMetricsRequest(), {
        transactionMeta,
      }),
  );

  messenger.subscribe(
    'TransactionController:transactionApproved',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionApproved(getTransactionMetricsRequest(), ...args),
  );

  messenger.subscribe(
    'TransactionController:transactionDropped',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionDropped(getTransactionMetricsRequest(), ...args),
  );

  messenger.subscribe(
    'TransactionController:transactionConfirmed',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (transactionMeta) =>
      handleTransactionConfirmed(
        getTransactionMetricsRequest(),
        transactionMeta as TransactionMetaEventPayload,
      ),
  );

  messenger.subscribe(
    'TransactionController:transactionFailed',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionFailed(getTransactionMetricsRequest(), ...args),
  );

  messenger.subscribe(
    'TransactionController:transactionRejected',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionRejected(getTransactionMetricsRequest(), ...args),
  );

  messenger.subscribe(
    'TransactionController:transactionSubmitted',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionSubmitted(getTransactionMetricsRequest(), ...args),
  );
}

export function getTransactionControllerApi(
  transactionController: TransactionController,
) {
  return {
    abortTransactionSigning: transactionController.abortTransactionSigning.bind(
      transactionController,
    ),
    getLayer1GasFee: transactionController.getLayer1GasFee.bind(
      transactionController,
    ),
    getTransactions: transactionController.getTransactions.bind(
      transactionController,
    ),
    isAtomicBatchSupported: transactionController.isAtomicBatchSupported.bind(
      transactionController,
    ),
    updateAtomicBatchData: transactionController.updateAtomicBatchData.bind(
      transactionController,
    ),
    updateBatchTransactions: transactionController.updateBatchTransactions.bind(
      transactionController,
    ),
    updateEditableParams: transactionController.updateEditableParams.bind(
      transactionController,
    ),
    updatePreviousGasParams: transactionController.updatePreviousGasParams.bind(
      transactionController,
    ),
    updateSelectedGasFeeToken:
      transactionController.updateSelectedGasFeeToken.bind(
        transactionController,
      ),
    updateTransactionGasFees:
      transactionController.updateTransactionGasFees.bind(
        transactionController,
      ),
    checkFirstTimeInteraction,
  };
}

/**
 * Returns whether the sender has no prior on-chain interaction with `to` on `chainId`,
 * or `undefined` when the relationship cannot be determined.
 * @param request
 */
async function checkFirstTimeInteraction(
  request: CheckFirstTimeInteractionRequest,
): Promise<boolean | undefined> {
  try {
    const result = await getAccountAddressRelationship(request);
    return result.count === undefined ? undefined : result.count === 0;
  } catch {
    return undefined;
  }
}

function getSavedGasFees(
  { messenger }: { messenger: TransactionControllerInitMessenger },
  transactionMeta: TransactionMeta,
): SavedGasFees | undefined {
  const account = transactionMeta.txParams.from?.toLowerCase();

  if (!account || transactionMeta.metamaskPay) {
    return undefined;
  }

  const { advancedGasFee } = messenger.call('PreferencesController:getState');
  const savedGasFeePreference =
    advancedGasFee[transactionMeta.chainId]?.[account];

  if (!savedGasFeePreference) {
    return undefined;
  }

  const savedGasFeeLevel = getSavedGasFeeLevel(
    savedGasFeePreference.userFeeLevel,
  );

  if (!savedGasFeeLevel) {
    return undefined;
  }

  const savedGasFees: SavedGasFees = {
    level: savedGasFeeLevel,
  };

  if (savedGasFeePreference.maxBaseFee) {
    savedGasFees.maxBaseFee = savedGasFeePreference.maxBaseFee;
  }

  if (savedGasFeePreference.priorityFee) {
    savedGasFees.priorityFee = savedGasFeePreference.priorityFee;
  }

  if (savedGasFeePreference.gasPrice) {
    savedGasFees.gasPrice = savedGasFeePreference.gasPrice;
  }

  return savedGasFees;
}

async function getSimulationConfig(
  { messenger }: { messenger: TransactionControllerInitMessenger },
  url: string,
  opts?: { txMeta?: { origin?: string } },
) {
  const getToken = () =>
    messenger.call('AuthenticationController:getBearerToken');
  const getShieldSubscription = () =>
    messenger.call(
      'SubscriptionController:getSubscriptionByProduct',
      PRODUCT_TYPES.SHIELD,
    );
  const origin = opts?.txMeta?.origin;
  return getShieldGatewayConfig(getToken, getShieldSubscription, url, {
    origin,
  });
}

async function isEIP7702GasFeeTokensEnabled(
  {
    getFlatState,
    messenger,
  }: {
    getFlatState: () => MessengerClientFlatState;
    messenger: TransactionControllerInitMessenger;
  },
  transactionMeta: TransactionMeta,
): Promise<boolean> {
  if (
    !(await accountSupports7702(
      transactionMeta.txParams?.from,
      getKeyringController(messenger),
    ))
  ) {
    return false;
  }

  const { chainId, isExternalSign } = transactionMeta;
  const uiState = getUIState(getFlatState());

  const isSmartTransactionEnabled = getIsSmartTransaction(uiState, chainId);

  const isSendBundleSupportedChain = await isSendBundleSupported(
    messenger,
    chainId,
  );

  // EIP7702 gas fee tokens are enabled when:
  // - Smart transactions are NOT enabled, OR
  // - Send bundle is NOT supported, OR
  // - Gas fee token was provided when creating transaction
  return (
    !isSmartTransactionEnabled ||
    !isSendBundleSupportedChain ||
    Boolean(isExternalSign)
  );
}

function getKeyringController(messenger: TransactionControllerInitMessenger) {
  return {
    getKeyringForAccount: (address: string) =>
      messenger.call('KeyringController:getKeyringForAccount', address),
  };
}

function getUIState(
  flatState: MessengerClientFlatState,
): Parameters<typeof getIsSmartTransaction>[0] {
  return { metamask: flatState } as Parameters<typeof getIsSmartTransaction>[0];
}

function isAutomaticGasFeeUpdateEnabled(transaction: TransactionMeta) {
  if (
    transaction.origin === ORIGIN_METAMASK &&
    transaction.type === TransactionType.tokenMethodApprove
  ) {
    return false;
  }

  return !hasTransactionType(
    transaction,
    DISABLED_AUTOMATIC_GAS_FEE_UPDATE_TYPES,
  );
}

function getSavedGasFeeLevel(
  userFeeLevel: string,
): SavedGasFees['level'] | undefined {
  const savedGasFeeLevels = [
    GasFeeEstimateLevel.Low,
    GasFeeEstimateLevel.Medium,
    GasFeeEstimateLevel.High,
    UserFeeLevel.CUSTOM,
  ] as const;

  return savedGasFeeLevels.find((level) => level === userFeeLevel);
}
