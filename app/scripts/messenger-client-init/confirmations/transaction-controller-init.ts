import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
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
import {
  TransactionPayControllerMessenger,
  TransactionPayPublishHook,
} from '@metamask/transaction-pay-controller';
import { Hex } from '@metamask/utils';
import { AccountOverviewTabKey } from '../../../../shared/constants/app-state';
import { trace } from '../../../../shared/lib/trace';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import { getIsSmartTransaction } from '../../../../shared/lib/selectors';
import { getShieldGatewayConfig } from '../../../../shared/lib/shield';
import { isEnforcedSimulationsEligible } from '../../../../shared/lib/transaction/enforced-simulations';
import { getEip7702SupportedChains } from '../../../../shared/lib/eip7702-support-utils';
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
import { accountSupports7702 } from '../../lib/account-supports-7702';
import { MessengerClientFlatState } from '../controller-list';
import { TransactionControllerInitMessenger } from '../messengers/transaction-controller-messenger';
import {
  MessengerClientInitFunction,
  MessengerClientInitRequest,
  MessengerClientInitResult,
} from '../types';

const DISABLED_AUTOMATIC_GAS_FEE_UPDATE_TYPES = [
  TransactionType.swap,
  TransactionType.swapApproval,
  TransactionType.bridge,
  TransactionType.bridgeApproval,
  TransactionType.relayDeposit,
  TransactionType.perpsRelayDeposit,
  TransactionType.predictRelayDeposit,
];

const TRANSACTION_SUBMISSION_METHOD_METRIC_NAME =
  'transaction_submission_method';

const TRANSACTION_SUBMISSION_METHOD = {
  SENTINEL_STX: 'sentinel_stx',
  SENTINEL_RELAY: 'sentinel_relay',
};

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

  const {
    gasFeeController,
    keyringController,
    networkController,
    onboardingController,
    preferencesController,
    smartTransactionsController,
  } = getControllers(request);

  const messengerClient: TransactionController = new TransactionController({
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
      isEnabled: () => false,
      updateTransactions: true,
    },
    isAutomaticGasFeeUpdateEnabled,
    isEIP7702GasFeeTokensEnabled: async (transactionMeta) => {
      if (
        !(await accountSupports7702(
          transactionMeta.txParams?.from,
          keyringController as Parameters<typeof accountSupports7702>[1],
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
      afterAdd: async ({
        transactionMeta,
      }: {
        transactionMeta: TransactionMeta;
      }) => {
        await initMessenger.call(
          'SubscriptionService:submitSubscriptionSponsorshipIntent',
          transactionMeta,
        );
        return {};
      },
      beforePublish: (transactionMeta: TransactionMeta) => {
        const response = initMessenger.call(
          'InstitutionalSnapController:publishHook',
          transactionMeta,
        );
        return response;
      },
      beforeSign: new EnforceSimulationHook({
        messenger: initMessenger,
        isEligible: (transactionMeta) =>
          isEnforcedSimulationsEligible(transactionMeta, {
            ...initMessenger.call('AppStateController:getState'),
            eip7702SupportedChains: getEip7702SupportedChains(
              initMessenger.call('RemoteFeatureFlagController:getState'),
            ),
          }),
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
          getTransactionMetricsRequest,
          initMessenger,
          keyringController,
          signedTx,
          smartTransactionsController: smartTransactionsController(),
          transactionController: messengerClient,
          transactionMeta,
        }),
      publishBatch: async (_request: PublishBatchHookRequest) => {
        const result = await publishBatchHook({
          transactionController: messengerClient,
          smartTransactionsController: smartTransactionsController(),
          hookControllerMessenger:
            initMessenger as SmartTransactionHookMessenger,
          flatState: getFlatState(),
          transactions: _request.transactions as PublishBatchHookTransaction[],
        });
        if (result) {
          for (const batchTx of _request.transactions) {
            if (batchTx.id) {
              try {
                getTransactionMetricsRequest().upsertTransactionUIMetricsFragment(
                  batchTx.id,
                  {
                    properties: {
                      [TRANSACTION_SUBMISSION_METHOD_METRIC_NAME]:
                        TRANSACTION_SUBMISSION_METHOD.SENTINEL_STX,
                    },
                  },
                );
              } catch (e) {
                console.error(
                  'Failed to record sentinel_stx metrics fragment for batch tx',
                  e,
                );
              }
            }
          }
        }
        return result;
      },
    },
    // @ts-expect-error Keyring controller expects TxData returned but TransactionController expects TypedTransaction
    sign: (...args) => keyringController().signTransaction(...args),
    state: persistedState.TransactionController,
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

function getControllers(
  request: MessengerClientInitRequest<
    TransactionControllerMessenger,
    TransactionControllerInitMessenger
  >,
) {
  return {
    gasFeeController: () => request.getMessengerClient('GasFeeController'),
    keyringController: () => request.getMessengerClient('KeyringController'),
    networkController: () => request.getMessengerClient('NetworkController'),
    onboardingController: () =>
      request.getMessengerClient('OnboardingController'),
    preferencesController: () =>
      request.getMessengerClient('PreferencesController'),
    smartTransactionsController: () =>
      request.getMessengerClient('SmartTransactionsController'),
    institutionalSnapController: () =>
      request.getMessengerClient('InstitutionalSnapController'),
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

function getUIState(flatState: MessengerClientFlatState) {
  return { metamask: flatState };
}

export async function publishHook({
  flatState,
  getTransactionMetricsRequest,
  initMessenger,
  keyringController,
  signedTx,
  smartTransactionsController,
  transactionController,
  transactionMeta,
}: {
  flatState: MessengerClientFlatState;
  getTransactionMetricsRequest: () => TransactionMetricsRequest;
  initMessenger: TransactionControllerInitMessenger;
  keyringController: Parameters<typeof accountSupports7702>[1];
  signedTx: string;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;
  transactionMeta: TransactionMeta;
}) {
  const { isSmartTransaction, featureFlags } = getSmartTransactionCommonParams(
    flatState,
    transactionMeta.chainId,
  );
  const sendBundleSupport = await isSendBundleSupported(
    transactionMeta.chainId,
  );

  const payResult = await new TransactionPayPublishHook({
    isSmartTransaction: () => isSmartTransaction,
    messenger: initMessenger as unknown as TransactionPayControllerMessenger,
  }).getHook()(transactionMeta, signedTx as Hex);

  if (payResult?.transactionHash) {
    return payResult;
  }

  const { isExternalSign } = transactionMeta;

  const keyringSupports7702 = await accountSupports7702(
    transactionMeta.txParams?.from,
    keyringController,
  );
  let attemptedHook = false;

  if (
    keyringSupports7702 &&
    (!isSmartTransaction || !sendBundleSupport || isExternalSign)
  ) {
    attemptedHook = true;
    const hook = new Delegation7702PublishHook({
      messenger: initMessenger,
    }).getHook();

    const result = await hook(transactionMeta, signedTx);
    if (result?.transactionHash) {
      try {
        getTransactionMetricsRequest().upsertTransactionUIMetricsFragment(
          transactionMeta.id,
          {
            properties: {
              [TRANSACTION_SUBMISSION_METHOD_METRIC_NAME]:
                TRANSACTION_SUBMISSION_METHOD.SENTINEL_RELAY,
            },
          },
        );
      } catch (e) {
        console.error('Failed to record sentinel_relay metrics fragment', e);
      }
      return result;
    }
    // else, fall back to regular regular transaction submission
  }

  if (
    isSmartTransaction &&
    (sendBundleSupport || transactionMeta.selectedGasFeeToken === undefined)
  ) {
    attemptedHook = true;
    const result = await submitSmartTransactionHook({
      transactionMeta,
      signedTransactionInHex: signedTx as Hex,
      transactionController,
      smartTransactionsController,
      controllerMessenger: initMessenger,
      isSmartTransaction,
      featureFlags,
    });

    if (result?.transactionHash) {
      try {
        getTransactionMetricsRequest().upsertTransactionUIMetricsFragment(
          transactionMeta.id,
          {
            properties: {
              [TRANSACTION_SUBMISSION_METHOD_METRIC_NAME]:
                TRANSACTION_SUBMISSION_METHOD.SENTINEL_STX,
            },
          },
        );
      } catch (e) {
        console.error('Failed to record sentinel_stx metrics fragment', e);
      }
      return result;
    }
    // else, fall back to regular regular transaction submission
  }

  if (attemptedHook) {
    try {
      await initMessenger.call(
        'AppStateController:setDefaultHomeActiveTabName',
        AccountOverviewTabKey.Activity,
      );
    } catch (error) {
      console.error(
        'Failed to set default home active tab for fallback transaction',
        error,
      );
    }
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
  flatState: MessengerClientFlatState;
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

  const { isSmartTransaction, featureFlags } = getSmartTransactionCommonParams(
    flatState,
    transactionMeta.chainId,
  );

  if (!isSmartTransaction) {
    return undefined;
  }

  return submitBatchSmartTransactionHook({
    transactions,
    transactionController,
    smartTransactionsController,
    controllerMessenger: hookControllerMessenger,
    isSmartTransaction,
    featureFlags,
    transactionMeta,
  });
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
