import {
  SavedGasFees,
  TransactionController,
  TransactionControllerPostTransactionBalanceUpdatedEvent,
  TransactionControllerState,
  TransactionControllerTransactionApprovedEvent,
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionDroppedEvent,
  TransactionControllerTransactionFailedEvent,
  TransactionControllerTransactionNewSwapApprovalEvent,
  TransactionControllerTransactionNewSwapEvent,
  TransactionControllerTransactionRejectedEvent,
  TransactionControllerTransactionStatusUpdatedEvent,
  TransactionControllerTransactionSubmittedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  NetworkController,
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import { GasFeeController } from '@metamask/gas-fee-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { Hex } from '@metamask/utils';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
} from '@metamask/base-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { ApprovalControllerActions } from '@metamask/approval-controller';
import { PreferencesController } from '../controllers/preferences-controller';
import {
  getCurrentChainSupportsSmartTransactions,
  getFeatureFlagsByChainId,
  getIsSmartTransaction,
  getSmartTransactionsPreferenceEnabled,
  isHardwareWallet,
} from '../../../shared/modules/selectors';
import { submitSmartTransactionHook } from '../lib/transaction/smart-transactions';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { trace } from '../../../shared/lib/trace';
import OnboardingController from '../controllers/onboarding';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  afterTransactionSign as afterTransactionSignMMI,
  beforeCheckPendingTransaction as beforeCheckPendingTransactionMMI,
  beforeTransactionPublish as beforeTransactionPublishMMI,
  getAdditionalSignArguments as getAdditionalSignArgumentsMMI,
} from '../lib/transaction/mmi-hooks';
///: END:ONLY_INCLUDE_IF
import {
  handlePostTransactionBalanceUpdate,
  handleTransactionAdded,
  handleTransactionApproved,
  handleTransactionConfirmed,
  handleTransactionDropped,
  handleTransactionFailed,
  handleTransactionRejected,
  handleTransactionSubmitted,
  TransactionMetricsRequest,
} from '../lib/transaction/metrics';
import {
  SwapsControllerSetApproveTxIdAction,
  SwapsControllerSetTradeTxIdAction,
} from '../controllers/swaps/swaps.types';
import { NetworkState } from '../../../shared/modules/selectors/networks';
import {
  ControllerGetApiRequest,
  ControllerGetApiResponse,
  ControllerInit,
  ControllerInitRequest,
  ControllerName,
} from './controller-init';

type MessengerActions =
  | ApprovalControllerActions
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | AccountsControllerGetSelectedAccountAction
  | SwapsControllerSetTradeTxIdAction
  | SwapsControllerSetApproveTxIdAction;

type MessengerEvents =
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerTransactionStatusUpdatedEvent
  | TransactionControllerTransactionNewSwapEvent
  | TransactionControllerTransactionNewSwapApprovalEvent
  | NetworkControllerStateChangeEvent;

export class TransactionControllerInit extends ControllerInit<
  TransactionController,
  MessengerActions,
  MessengerEvents
> {
  public init(
    request: ControllerInitRequest<MessengerActions, MessengerEvents>,
  ): TransactionController {
    const {
      controllerMessenger,
      getGlobalChainId,
      getPermittedAccounts,
      getStateUI,
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
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      transactionUpdateController,
      ///: END:ONLY_INCLUDE_IF
    } = this.#getControllers(request);

    const transactionControllerMessenger = controllerMessenger.getRestricted({
      name: 'TransactionController',
      allowedActions: [
        `ApprovalController:addRequest`,
        'NetworkController:findNetworkClientIdByChainId',
        'NetworkController:getNetworkClientById',
        'AccountsController:getSelectedAccount',
      ],
      allowedEvents: [`NetworkController:stateChange`],
    });

    const controller = new TransactionController({
      getCurrentNetworkEIP1559Compatibility: () =>
        networkController().getEIP1559Compatibility() as Promise<boolean>,
      getCurrentAccountEIP1559Compatibility: async () => true,
      // @ts-expect-error Mismatched types
      getExternalPendingTransactions: (address) =>
        this.#getExternalPendingTransactions(
          smartTransactionsController(),
          address,
        ),
      getGasFeeEstimates: gasFeeController().fetchGasFeeEstimates.bind(
        gasFeeController(),
      ),
      getNetworkClientRegistry:
        networkController().getNetworkClientRegistry.bind(networkController()),
      getNetworkState: () => networkController().state,
      // @ts-expect-error Mismatched types
      getPermittedAccounts: getPermittedAccounts.bind(this),
      getSavedGasFees: () => {
        const globalChainId = getGlobalChainId();
        return preferencesController().state.advancedGasFee[
          globalChainId
        ] as unknown as SavedGasFees;
      },
      incomingTransactions: {
        etherscanApiKeysByChainId: {
          [CHAIN_IDS.MAINNET as Hex]: process.env.ETHERSCAN_API_KEY as string,
          [CHAIN_IDS.SEPOLIA as Hex]: process.env.ETHERSCAN_API_KEY as string,
        },
        includeTokenTransfers: false,
        isEnabled: () =>
          preferencesController().state.incomingTransactionsPreferences?.[
            // @ts-expect-error Mismatched types
            getGlobalChainId()
          ] && onboardingController().state.completedOnboarding,
        queryEntireHistory: false,
        updateTransactions: false,
      },
      isFirstTimeInteractionEnabled: () =>
        preferencesController().state.securityAlertsEnabled,
      isSimulationEnabled: () =>
        preferencesController().state.useTransactionSimulations,
      messenger: transactionControllerMessenger,
      pendingTransactions: {
        isResubmitEnabled: () =>
          !(
            getSmartTransactionsPreferenceEnabled(
              getStateUI() as Parameters<
                typeof getSmartTransactionsPreferenceEnabled
              >[0],
            ) &&
            getCurrentChainSupportsSmartTransactions(
              getStateUI() as NetworkState,
            )
          ),
      },
      testGasFeeFlows: Boolean(process.env.TEST_GAS_FEE_FLOWS),
      // @ts-expect-error Mismatched types
      trace,
      hooks: {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        afterSign: (txMeta, signedEthTx) =>
          afterTransactionSignMMI(
            txMeta,
            signedEthTx,
            transactionUpdateController().addTransactionToWatchList.bind(
              transactionUpdateController(),
            ),
          ),
        beforeCheckPendingTransaction:
          beforeCheckPendingTransactionMMI.bind(this),
        beforePublish: beforeTransactionPublishMMI.bind(this),
        getAdditionalSignArguments: getAdditionalSignArgumentsMMI.bind(this),
        ///: END:ONLY_INCLUDE_IF
        // @ts-expect-error Mismatched types
        publish: (...args) =>
          // @ts-expect-error Mismatched types
          this.#publishSmartTransactionHook(
            controller,
            smartTransactionsController(),
            controllerMessenger,
            getStateUI(),
            ...args,
          ),
      },
      // @ts-expect-error Mismatched types
      sign: (...args) => keyringController().signTransaction(...args),
      state: persistedState.TransactionController as TransactionControllerState,
    });

    this.#addTransactionControllerListeners(
      controllerMessenger,
      getTransactionMetricsRequest,
    );

    return controller;
  }

  override getApi(
    request: ControllerGetApiRequest<TransactionController>,
  ): ControllerGetApiResponse {
    const { controller } = request;

    return {
      abortTransactionSigning:
        controller.abortTransactionSigning.bind(controller),
      createCancelTransaction: this.#createCancelTransaction.bind(
        this,
        request,
      ),
      getLayer1GasFee: controller.getLayer1GasFee.bind(controller),
      getTransactions: controller.getTransactions.bind(controller),
      updateEditableParams: controller.updateEditableParams.bind(controller),
      updatePreviousGasParams:
        controller.updatePreviousGasParams.bind(controller),
      updateTransactionGasFees:
        controller.updateTransactionGasFees.bind(controller),
      updateTransactionSendFlowHistory:
        controller.updateTransactionSendFlowHistory.bind(controller),
    };
  }

  override getMemStateKey(
    _controller: TransactionController,
  ): string | undefined {
    return 'TxController';
  }

  #getControllers(
    request: ControllerInitRequest<MessengerActions, MessengerEvents>,
  ) {
    return {
      gasFeeController: () =>
        request.getController<GasFeeController>(
          ControllerName.GasFeeController,
        ),
      keyringController: () =>
        request.getController<KeyringController>(
          ControllerName.KeyringController,
        ),
      networkController: () =>
        request.getController<NetworkController>(
          ControllerName.NetworkController,
        ),
      onboardingController: () =>
        request.getController<OnboardingController>(
          ControllerName.OnboardingController,
        ),
      preferencesController: () =>
        request.getController<PreferencesController>(
          ControllerName.PreferencesController,
        ),
      smartTransactionsController: () =>
        request.getController<SmartTransactionsController>(
          ControllerName.SmartTransactionsController,
        ),
      transactionUpdateController: () =>
        request.getController<TransactionUpdateController>(
          ControllerName.TransactionUpdateController,
        ),
    };
  }

  #publishSmartTransactionHook(
    transactionController: TransactionController,
    smartTransactionsController: SmartTransactionsController,
    controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>,
    uiState: unknown,
    transactionMeta: TransactionMeta,
    signedTransactionInHex: Hex,
  ) {
    const isSmartTransaction = getIsSmartTransaction(
      uiState as Parameters<typeof getIsSmartTransaction>[0],
    );

    if (!isSmartTransaction) {
      // Will cause TransactionController to publish to the RPC provider as normal.
      return { transactionHash: undefined };
    }

    const featureFlags = getFeatureFlagsByChainId(
      uiState as Parameters<typeof getFeatureFlagsByChainId>[0],
    );

    return submitSmartTransactionHook({
      transactionMeta,
      signedTransactionInHex,
      transactionController,
      smartTransactionsController,
      // @ts-expect-error Mismatched types
      controllerMessenger,
      isSmartTransaction,
      isHardwareWallet: isHardwareWallet(
        uiState as Parameters<typeof isHardwareWallet>,
      ),
      // @ts-expect-error Mismatched types
      featureFlags,
    });
  }

  #getExternalPendingTransactions(
    smartTransactionsController: SmartTransactionsController,
    address: string,
  ) {
    return smartTransactionsController.getTransactions({
      addressFrom: address,
      status: SmartTransactionStatuses.PENDING,
    });
  }

  #addTransactionControllerListeners(
    controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>,
    getTransactionMetricsRequest: () => TransactionMetricsRequest,
  ) {
    const transactionMetricsRequest = getTransactionMetricsRequest();

    controllerMessenger.subscribe(
      'TransactionController:postTransactionBalanceUpdated',
      handlePostTransactionBalanceUpdate.bind(null, transactionMetricsRequest),
    );

    controllerMessenger.subscribe(
      'TransactionController:unapprovedTransactionAdded',
      (transactionMeta) =>
        handleTransactionAdded(transactionMetricsRequest, { transactionMeta }),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionApproved',
      handleTransactionApproved.bind(null, transactionMetricsRequest),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionDropped',
      handleTransactionDropped.bind(null, transactionMetricsRequest),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionConfirmed',
      // @ts-expect-error Mismatched types
      handleTransactionConfirmed.bind(null, transactionMetricsRequest),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionFailed',
      handleTransactionFailed.bind(null, transactionMetricsRequest),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionNewSwap',
      ({ transactionMeta }) =>
        // TODO: This can be called internally by the TransactionController
        // since Swaps Controller registers this action handler
        controllerMessenger.call(
          'SwapsController:setTradeTxId',
          transactionMeta.id,
        ),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionNewSwapApproval',
      ({ transactionMeta }) =>
        // TODO: This can be called internally by the TransactionController
        // since Swaps Controller registers this action handler
        controllerMessenger.call(
          'SwapsController:setApproveTxId',
          transactionMeta.id,
        ),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionRejected',
      handleTransactionRejected.bind(null, transactionMetricsRequest),
    );

    controllerMessenger.subscribe(
      'TransactionController:transactionSubmitted',
      handleTransactionSubmitted.bind(null, transactionMetricsRequest),
    );
  }

  async #createCancelTransaction(
    request: ControllerGetApiRequest<TransactionController>,
    ...args: Parameters<TransactionController['stopTransaction']>
  ) {
    await request.controller.stopTransaction(...args);
    return request.getFlatState();
  }
}
