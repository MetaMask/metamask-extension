import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import {
  type PublishBatchHookRequest,
  type PublishBatchHookTransaction,
  SavedGasFees,
  TransactionController,
  TransactionControllerMessenger,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  SmartTransactionsController,
  SmartTransactionStatuses,
} from '@metamask/smart-transactions-controller';
import { Hex } from '@metamask/utils';
import { NetworkClientId } from '@metamask/network-controller';
import { toHex } from '@metamask/controller-utils';
import { trace } from '../../../../shared/lib/trace';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { getShieldGatewayConfig } from '../../../../shared/modules/shield';
import { TransactionMetricsRequest } from '../../../../shared/types/metametrics';
import {
  getSmartTransactionCommonParams,
  SmartTransactionHookMessenger,
  submitBatchSmartTransactionHook,
  submitSmartTransactionHook,
} from '../../lib/smart-transaction/smart-transactions';
import { Delegation7702PublishHook } from '../../lib/transaction/hooks/delegation-7702-publish';
import { EnforceSimulationHook } from '../../lib/transaction/hooks/enforce-simulation-hook';
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
import { getTransactionById } from '../../lib/transaction/util';
import { ControllerFlatState } from '../controller-list';
import { TransactionControllerInitMessenger } from '../messengers/transaction-controller-messenger';
import {
  ControllerInitFunction,
  ControllerInitRequest,
  ControllerInitResult,
} from '../types';

export const TransactionControllerInit: ControllerInitFunction<
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

  const {
    gasFeeController,
    keyringController,
    networkController,
    onboardingController,
    preferencesController,
    smartTransactionsController,
  } = getControllers(request);

  const controller: TransactionController = new TransactionController({
    getCurrentNetworkEIP1559Compatibility: () =>
      // @ts-expect-error Controller type does not support undefined return value
      initMessenger.call('NetworkController:getEIP1559Compatibility'),
    getCurrentAccountEIP1559Compatibility: async () => true,
    // @ts-expect-error Mismatched types
    getExternalPendingTransactions: (address) =>
      getExternalPendingTransactions(smartTransactionsController(), address),
    getGasFeeEstimates: (...args) =>
      gasFeeController().fetchGasFeeEstimates(...args),
    getNetworkClientRegistry: (...args) =>
      networkController().getNetworkClientRegistry(...args),
    getNetworkState: () => networkController().state,
    // @ts-expect-error Controller type does not support undefined return value
    getPermittedAccounts,
    getSavedGasFees: (chainId) => {
      return preferencesController().state.advancedGasFee[
        chainId
      ] as unknown as SavedGasFees | undefined;
    },
    getSimulationConfig: async (url, opts) => {
      const getToken = () =>
        initMessenger.call('AuthenticationController:getBearerToken');
      const getShieldSubscription = () =>
        initMessenger.call(
          'SubscriptionController:getSubscriptionByProduct',
          PRODUCT_TYPES.SHIELD,
        );
      const origin = opts?.txMeta?.origin;
      return getShieldGatewayConfig(getToken, getShieldSubscription, url, {
        origin,
      });
    },
    incomingTransactions: {
      client: `extension-${process.env.METAMASK_VERSION?.replace(/\./gu, '-')}`,
      includeTokenTransfers: false,
      isEnabled: () =>
        preferencesController().state.useExternalServices &&
        onboardingController().state.completedOnboarding,
      updateTransactions: true,
    },
    isAutomaticGasFeeUpdateEnabled: ({ type }) => {
      // Disables automatic gas fee updates for swap and bridge transactions
      // which provide their own gas parameters when they are submitted
      const disabledTypes = [
        TransactionType.swap,
        TransactionType.swapApproval,
        TransactionType.bridge,
        TransactionType.bridgeApproval,
      ];

      return !type || !disabledTypes.includes(type);
    },
    isEIP7702GasFeeTokensEnabled: async (transactionMeta) => {
      const { chainId } = transactionMeta;
      const uiState = getUIState(getFlatState());

      // @ts-expect-error Smart transaction selector types does not match controller state
      const isSmartTransactionEnabled = getIsSmartTransaction(uiState, chainId);

      const isSendBundleSupportedChain = await isSendBundleSupported(chainId);

      // EIP7702 gas fee tokens are enabled when:
      // - Smart transactions are NOT enabled, OR
      // - Send bundle is NOT supported
      return !isSmartTransactionEnabled || !isSendBundleSupportedChain;
    },
    isFirstTimeInteractionEnabled: () =>
      preferencesController().state.securityAlertsEnabled,
    isSimulationEnabled: () =>
      preferencesController().state.useTransactionSimulations,
    messenger: controllerMessenger,
    pendingTransactions: {
      isResubmitEnabled: () => false,
    },
    publicKeyEIP7702: process.env.EIP_7702_PUBLIC_KEY as Hex | undefined,
    testGasFeeFlows: Boolean(process.env.TEST_GAS_FEE_FLOWS === 'true'),
    // @ts-expect-error Controller uses string for names rather than enum
    trace,
    hooks: {
      // Note: `#afterAdd.updateTransaction` is actually called before adding the TransactionMeta to the state
      // Reference: https://github.com/MetaMask/core/blob/main/packages/transaction-controller/src/TransactionController.ts#L1335
      afterAdd: async (_params: { transactionMeta: TransactionMeta }) => {
        return {
          updateTransaction: async (transactionMeta: TransactionMeta) => {
            await initMessenger.call(
              'SubscriptionService:submitSubscriptionSponsorshipIntent',
              transactionMeta,
            );
          },
        };
      },
      afterSimulate: new EnforceSimulationHook({
        messenger: initMessenger,
      }).getAfterSimulateHook(),
      beforePublish: (transactionMeta: TransactionMeta) => {
        const response = initMessenger.call(
          'InstitutionalSnapController:publishHook',
          transactionMeta,
        );
        return response;
      },
      beforeSign: new EnforceSimulationHook({
        messenger: initMessenger,
      }).getBeforeSignHook(),
      beforeCheckPendingTransactions: (transactionMeta: TransactionMeta) => {
        const response = initMessenger.call(
          'InstitutionalSnapController:beforeCheckPendingTransactionHook',
          transactionMeta,
        );

        return response;
      },
      // @ts-expect-error Controller type does not support undefined return value
      publish: (transactionMeta, signedTx) =>
        publishHook({
          flatState: getFlatState(),
          initMessenger,
          signedTx,
          smartTransactionsController: smartTransactionsController(),
          transactionController: controller,
          transactionMeta,
        }),
      publishBatch: async (_request: PublishBatchHookRequest) =>
        await publishBatchHook({
          transactionController: controller,
          smartTransactionsController: smartTransactionsController(),
          hookControllerMessenger:
            initMessenger as SmartTransactionHookMessenger,
          flatState: getFlatState(),
          transactions: _request.transactions as PublishBatchHookTransaction[],
        }),
    },
    // @ts-expect-error Keyring controller expects TxData returned but TransactionController expects TypedTransaction
    sign: (...args) => keyringController().signTransaction(...args),
    state: persistedState.TransactionController,
  });

  addTransactionControllerListeners(
    initMessenger,
    getTransactionMetricsRequest,
  );

  const api = getApi(controller);

  return { controller, api, memStateKey: 'TxController' };
};

function getApi(
  controller: TransactionController,
): ControllerInitResult<TransactionController>['api'] {
  return {
    abortTransactionSigning:
      controller.abortTransactionSigning.bind(controller),
    getLayer1GasFee: controller.getLayer1GasFee.bind(controller),
    getTransactions: controller.getTransactions.bind(controller),
    isAtomicBatchSupported: controller.isAtomicBatchSupported.bind(controller),
    startIncomingTransactionPolling:
      controller.startIncomingTransactionPolling.bind(controller),
    stopIncomingTransactionPolling:
      controller.stopIncomingTransactionPolling.bind(controller),
    updateAtomicBatchData: controller.updateAtomicBatchData.bind(controller),
    updateBatchTransactions:
      controller.updateBatchTransactions.bind(controller),
    updateEditableParams: controller.updateEditableParams.bind(controller),
    updatePreviousGasParams:
      controller.updatePreviousGasParams.bind(controller),
    updateSelectedGasFeeToken:
      controller.updateSelectedGasFeeToken.bind(controller),
    updateTransactionGasFees:
      controller.updateTransactionGasFees.bind(controller),
  };
}

function getControllers(
  request: ControllerInitRequest<
    TransactionControllerMessenger,
    TransactionControllerInitMessenger
  >,
) {
  return {
    gasFeeController: () => request.getController('GasFeeController'),
    keyringController: () => request.getController('KeyringController'),
    networkController: () => request.getController('NetworkController'),
    onboardingController: () => request.getController('OnboardingController'),
    preferencesController: () => request.getController('PreferencesController'),
    smartTransactionsController: () =>
      request.getController('SmartTransactionsController'),
    institutionalSnapController: () =>
      request.getController('InstitutionalSnapController'),
  };
}

function getExternalPendingTransactions(
  smartTransactionsController: SmartTransactionsController,
  address: string,
) {
  return smartTransactionsController.getTransactions({
    addressFrom: address,
    status: SmartTransactionStatuses.PENDING,
  });
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
    'TransactionController:transactionNewSwap',
    ({ transactionMeta }) =>
      // TODO: This can be called internally by the TransactionController
      // since Swaps Controller registers this action handler
      initMessenger.call('SwapsController:setTradeTxId', transactionMeta.id),
  );

  initMessenger.subscribe(
    'TransactionController:transactionNewSwapApproval',
    ({ transactionMeta }) =>
      // TODO: This can be called internally by the TransactionController
      // since Swaps Controller registers this action handler
      initMessenger.call('SwapsController:setApproveTxId', transactionMeta.id),
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

function getUIState(flatState: ControllerFlatState) {
  return { metamask: flatState };
}

async function getNextNonce(
  transactionController: TransactionController,
  address: string,
  networkClientId: NetworkClientId,
): Promise<Hex> {
  const nonceLock = await transactionController.getNonceLock(
    address,
    networkClientId,
  );
  nonceLock.releaseLock();
  return toHex(nonceLock.nextNonce);
}

export async function publishHook({
  flatState,
  initMessenger,
  signedTx,
  smartTransactionsController,
  transactionController,
  transactionMeta,
}: {
  flatState: ControllerFlatState;
  initMessenger: TransactionControllerInitMessenger;
  signedTx: string;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;
  transactionMeta: TransactionMeta;
}) {
  const { isSmartTransaction, featureFlags, isHardwareWalletAccount } =
    getSmartTransactionCommonParams(flatState, transactionMeta.chainId);
  const sendBundleSupport = await isSendBundleSupported(
    transactionMeta.chainId,
  );

  if (!isSmartTransaction || !sendBundleSupport) {
    const hook = new Delegation7702PublishHook({
      isAtomicBatchSupported: transactionController.isAtomicBatchSupported.bind(
        transactionController,
      ),
      messenger: initMessenger,
      getNextNonce: (address, networkClientId) =>
        getNextNonce(transactionController, address, networkClientId),
    }).getHook();

    const result = await hook(transactionMeta, signedTx);
    if (result?.transactionHash) {
      return result;
    }
    // else, fall back to regular regular transaction submission
  }

  if (
    isSmartTransaction &&
    (sendBundleSupport || transactionMeta.selectedGasFeeToken === undefined)
  ) {
    const result = await submitSmartTransactionHook({
      transactionMeta,
      signedTransactionInHex: signedTx as Hex,
      transactionController,
      smartTransactionsController,
      controllerMessenger: initMessenger,
      isSmartTransaction,
      isHardwareWallet: isHardwareWalletAccount,
      // @ts-expect-error Smart transaction selector return type does not match FeatureFlags type from hook
      featureFlags,
    });

    if (result?.transactionHash) {
      return result;
    }
    // else, fall back to regular regular transaction submission
  }

  // Default: fall back to regular transaction submission
  return { transactionHash: undefined };
}

export function publishBatchHook({
  transactionController,
  smartTransactionsController,
  hookControllerMessenger,
  flatState,
  transactions,
}: {
  transactionController: TransactionController;
  smartTransactionsController: SmartTransactionsController;
  hookControllerMessenger: SmartTransactionHookMessenger;
  flatState: ControllerFlatState;
  transactions: PublishBatchHookTransaction[];
}) {
  // Get transactionMeta based on the last transaction ID
  const lastTransaction = transactions[transactions.length - 1];
  const transactionMeta = getTransactionById(
    lastTransaction.id ?? '',
    transactionController,
  );

  // If we couldn't find the transaction, we should handle that gracefully
  if (!transactionMeta) {
    throw new Error(
      `publishBatchSmartTransactionHook: Could not find transaction with id ${lastTransaction.id}`,
    );
  }

  const { isSmartTransaction, featureFlags, isHardwareWalletAccount } =
    getSmartTransactionCommonParams(flatState, transactionMeta.chainId);

  if (!isSmartTransaction) {
    return undefined;
  }

  return submitBatchSmartTransactionHook({
    transactions,
    transactionController,
    smartTransactionsController,
    controllerMessenger: hookControllerMessenger,
    isSmartTransaction,
    isHardwareWallet: isHardwareWalletAccount,
    // @ts-expect-error Smart transaction selector return type does not match FeatureFlags type from hook
    featureFlags,
    transactionMeta,
  });
}
