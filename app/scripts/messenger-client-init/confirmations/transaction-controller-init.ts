import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  SavedGasFees,
  TransactionController,
  TransactionControllerMessenger,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { trace } from '../../../../shared/lib/trace';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import { getIsSmartTransaction } from '../../../../shared/lib/selectors';
import { getShieldGatewayConfig } from '../../../../shared/lib/shield';
import { TransactionMetricsRequest } from '../../../../shared/types/metametrics';
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
import { MessengerClientFlatState } from '../controller-list';
import { TransactionControllerInitMessenger } from '../messengers/transaction-controller-messenger';
import {
  MessengerClientInitFunction,
  MessengerClientInitResult,
} from '../types';
import { getTransactionControllerHooks } from '../../lib/transaction/hooks';

const DISABLED_AUTOMATIC_GAS_FEE_UPDATE_TYPES = [
  TransactionType.swap,
  TransactionType.swapApproval,
  TransactionType.bridge,
  TransactionType.bridgeApproval,
  TransactionType.relayDeposit,
  TransactionType.perpsRelayDeposit,
  TransactionType.predictRelayDeposit,
];

export const TransactionControllerInit: MessengerClientInitFunction<
  TransactionController,
  TransactionControllerMessenger,
  TransactionControllerInitMessenger
> = (request) => {
  const {
    controllerMessenger,
    initMessenger,
    getFlatState,
    getPermittedAccounts,
    getTransactionMetricsRequest,
    persistedState,
  } = request;

  const messengerClient: TransactionController = new TransactionController({
    // @ts-expect-error Controller type does not support undefined return value
    getPermittedAccounts,
    getSavedGasFees: getSavedGasFees.bind(null, { messenger: initMessenger }),
    getSimulationConfig: getSimulationConfig.bind(null, {
      messenger: initMessenger,
    }),
    hooks: getTransactionControllerHooks({
      getFlatState,
      getTransactionMetricsRequest,
      messenger: initMessenger,
    }),
    incomingTransactions: {
      client: `extension-${process.env.METAMASK_VERSION?.replace(/\./gu, '-')}`,
      includeTokenTransfers: false,
      isEnabled: () => false,
      updateTransactions: true,
    },
    isAutomaticGasFeeUpdateEnabled,
    isEIP7702GasFeeTokensEnabled: isEIP7702GasFeeTokensEnabled.bind(null, {
      getFlatState,
      messenger: initMessenger,
    }),
    isFirstTimeInteractionEnabled: () =>
      initMessenger.call('PreferencesController:getState').securityAlertsEnabled,
    isSimulationEnabled: () =>
      initMessenger.call('PreferencesController:getState')
        .useTransactionSimulations,
    messenger: controllerMessenger,
    publicKeyEIP7702: process.env.EIP_7702_PUBLIC_KEY as Hex | undefined,
    state: persistedState.TransactionController,
    testGasFeeFlows: Boolean(process.env.TEST_GAS_FEE_FLOWS === 'true'),
    // @ts-expect-error Controller uses string for names rather than enum
    trace,
  });

  addTransactionControllerListeners(
    initMessenger,
    getTransactionMetricsRequest,
  );

  const api = getApi(messengerClient);

  return { messengerClient, api, memStateKey: 'TxController' };
};

function getApi(
  messengerClient: TransactionController,
): MessengerClientInitResult<TransactionController>['api'] {
  return {
    abortTransactionSigning:
      messengerClient.abortTransactionSigning.bind(messengerClient),
    getLayer1GasFee: messengerClient.getLayer1GasFee.bind(messengerClient),
    getTransactions: messengerClient.getTransactions.bind(messengerClient),
    isAtomicBatchSupported:
      messengerClient.isAtomicBatchSupported.bind(messengerClient),
    startIncomingTransactionPolling:
      messengerClient.startIncomingTransactionPolling.bind(messengerClient),
    stopIncomingTransactionPolling:
      messengerClient.stopIncomingTransactionPolling.bind(messengerClient),
    updateAtomicBatchData:
      messengerClient.updateAtomicBatchData.bind(messengerClient),
    updateBatchTransactions:
      messengerClient.updateBatchTransactions.bind(messengerClient),
    updateEditableParams:
      messengerClient.updateEditableParams.bind(messengerClient),
    updatePreviousGasParams:
      messengerClient.updatePreviousGasParams.bind(messengerClient),
    updateSelectedGasFeeToken:
      messengerClient.updateSelectedGasFeeToken.bind(messengerClient),
    updateTransactionGasFees:
      messengerClient.updateTransactionGasFees.bind(messengerClient),
  };
}

function addTransactionControllerListeners(
  initMessenger: TransactionControllerInitMessenger,
  getTransactionMetricsRequest: () => TransactionMetricsRequest,
) {
  const transactionMetricsRequest = getTransactionMetricsRequest();

  initMessenger.subscribe(
    'TransactionController:postTransactionBalanceUpdated',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    handlePostTransactionBalanceUpdate.bind(null, transactionMetricsRequest),
  );

  initMessenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (transactionMeta) =>
      handleTransactionAdded(transactionMetricsRequest, { transactionMeta }),
  );

  initMessenger.subscribe(
    'TransactionController:transactionApproved',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    handleTransactionApproved.bind(null, transactionMetricsRequest),
  );

  initMessenger.subscribe(
    'TransactionController:transactionDropped',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    handleTransactionDropped.bind(null, transactionMetricsRequest),
  );

  initMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    // @ts-expect-error Error is string in metrics code but TransactionError in TransactionMeta type from controller
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    handleTransactionConfirmed.bind(null, transactionMetricsRequest),
  );

  initMessenger.subscribe(
    'TransactionController:transactionFailed',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    handleTransactionFailed.bind(null, transactionMetricsRequest),
  );

  initMessenger.subscribe(
    'TransactionController:transactionRejected',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    handleTransactionRejected.bind(null, transactionMetricsRequest),
  );

  initMessenger.subscribe(
    'TransactionController:transactionSubmitted',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    handleTransactionSubmitted.bind(null, transactionMetricsRequest),
  );
}

function getSavedGasFees(
  { messenger }: { messenger: TransactionControllerInitMessenger },
  chainId: string,
): SavedGasFees | undefined {
  const { advancedGasFee } = messenger.call('PreferencesController:getState');
  return advancedGasFee[chainId] as unknown as SavedGasFees | undefined;
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

  // @ts-expect-error Smart transaction selector types does not match controller state
  const isSmartTransactionEnabled = getIsSmartTransaction(uiState, chainId);

  const isSendBundleSupportedChain = await isSendBundleSupported(chainId);

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

function getUIState(flatState: MessengerClientFlatState) {
  return { metamask: flatState };
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
