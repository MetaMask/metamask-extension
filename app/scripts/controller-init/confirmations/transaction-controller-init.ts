import {
  type PublishBatchHookRequest,
  type PublishBatchHookTransaction,
  TransactionController,
  TransactionControllerMessenger,
  TransactionMeta,
} from '@metamask/transaction-controller';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import { Hex } from '@metamask/utils';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import {
  SmartTransactionHookMessenger,
  publishSmartTransactionHook,
  publishBatchSmartTransactionHook,
} from '../../lib/smart-transaction/smart-transactions';
import { trace } from '../../../../shared/lib/trace';

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
import {
  ControllerInitFunction,
  ControllerInitRequest,
  ControllerInitResult,
} from '../types';
import { TransactionControllerInitMessenger } from '../messengers/transaction-controller-messenger';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { MessageParamsTypedData } from '@metamask/signature-controller';
import { signIntent, type CowOrderInput } from '../../lib/transaction/intent';
import { ControllerFlatState } from '../controller-list';
import { TransactionMetricsRequest } from '../../../../shared/types/metametrics';
import { EnforceSimulationHook } from '../../lib/transaction/hooks/enforce-simulation-hook';

export const TransactionControllerInit: ControllerInitFunction<
  TransactionController,
  TransactionControllerMessenger,
  TransactionControllerInitMessenger
> = (request) => {
  const {
    controllerMessenger,
    initMessenger,
    getFlatState,
    getGlobalChainId,
    getPermittedAccounts,
    getTransactionMetricsRequest,
    updateAccountBalanceForTransactionNetwork,
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
    // @ts-expect-error Preferences controller uses Record rather than specific type
    getSavedGasFees: () => {
      const globalChainId = getGlobalChainId();
      return preferencesController().state.advancedGasFee[globalChainId];
    },
    incomingTransactions: {
      client: `extension-${process.env.METAMASK_VERSION?.replace(/\./gu, '-')}`,
      includeTokenTransfers: false,
      isEnabled: () =>
        preferencesController().state.useExternalServices &&
        onboardingController().state.completedOnboarding,
      updateTransactions: true,
    },
    isAutomaticGasFeeUpdateEnabled: () => true,
    isEIP7702GasFeeTokensEnabled: async (transactionMeta) => {
      const { chainId } = transactionMeta;
      const uiState = getUIState(getFlatState());

      // @ts-expect-error Smart transaction selector types does not match controller state
      return !getIsSmartTransaction(uiState, chainId);
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
        publishSmartTransactionHook({
          flatState: getFlatState(),
          initMessenger,
          signedTx,
          smartTransactionsController: smartTransactionsController(),
          transactionController: controller,
          transactionMeta,
        }),
      publishBatch: async (_request: PublishBatchHookRequest) =>
        await publishBatchSmartTransactionHook({
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
    updateAccountBalanceForTransactionNetwork,
  );

  const api = getApi(controller, initMessenger);

  return { controller, api, memStateKey: 'TxController' };
};

function getApi(
  controller: TransactionController,
  initMessenger: TransactionControllerInitMessenger,
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
    updateTransactionSendFlowHistory:
      controller.updateTransactionSendFlowHistory.bind(controller),
    // Expose a safe EIP-712 v4 signing method to the UI (pattern mirrors delegation.ts)
  signTypedDataV4: (params: { from: string; data: MessageParamsTypedData }) =>
      initMessenger.call(
        'KeyringController:signTypedMessage',
        params,
        SignTypedDataVersion.V4,
      ),
    // Intent-specific helper: constructs and signs a CoW order using the background messenger
    signIntent: (params: {
      chainId: number;
      from: string;
      order: CowOrderInput;
      verifyingContract: string;
    }) =>
      signIntent({
        chainId: params.chainId,
        from: params.from as `0x${string}`,
        order: params.order,
        verifyingContract: params.verifyingContract as `0x${string}`,
        messenger: initMessenger,
      }),
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
  updateAccountBalanceForTransactionNetwork: (
    transactionMeta: TransactionMeta,
  ) => void,
) {
  const transactionMetricsRequest = getTransactionMetricsRequest();

  initMessenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    updateAccountBalanceForTransactionNetwork,
  );

  initMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    updateAccountBalanceForTransactionNetwork,
  );

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
