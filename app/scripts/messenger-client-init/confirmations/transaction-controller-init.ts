import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  SavedGasFees,
  TransactionController,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { WalletOptions } from '@metamask/wallet';

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
import {
  TransactionControllerInitMessenger,
  getTransactionControllerInitMessenger,
} from '../messengers/transaction-controller-messenger';
import { InitializeWalletRequest } from '../../wallet-init/types';
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

export function getTransactionControllerOptions(
  request: InitializeWalletRequest,
): NonNullable<WalletOptions['instanceOptions']>['transactionController'] {
  const { getPermittedAccounts, messenger: rootMessenger } = request;

  const messenger = getTransactionControllerInitMessenger(rootMessenger);

  return {
    disableSwaps: false,
    getPermittedAccounts: (origin?: string) => getPermittedAccounts(origin),
    getSavedGasFees: (chainId: string) => {
      const { advancedGasFee } = messenger.call(
        'PreferencesController:getState',
      );
      return advancedGasFee[chainId] as unknown as SavedGasFees | undefined;
    },
    getSimulationConfig: getSimulationConfig.bind(null, {
      messenger,
    }),
    hooks: getTransactionControllerHooks({
      getFlatState: request.getFlatState,
      getTransactionMetricsRequest: request.getTransactionMetricsRequest,
      messenger,
    }),
    isAutomaticGasFeeUpdateEnabled,
    isEIP7702GasFeeTokensEnabled: isEIP7702GasFeeTokensEnabled.bind(null, {
      getFlatState: request.getFlatState,
      messenger,
    }),
    isFirstTimeInteractionEnabled: () =>
      messenger.call('PreferencesController:getState').securityAlertsEnabled,
    isSimulationEnabled: () =>
      messenger.call('PreferencesController:getState')
        .useTransactionSimulations,
    publicKeyEIP7702: process.env.EIP_7702_PUBLIC_KEY as Hex | undefined,
    testGasFeeFlows: Boolean(process.env.TEST_GAS_FEE_FLOWS === 'true'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trace: trace as any,
  };
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
    startIncomingTransactionPolling:
      transactionController.startIncomingTransactionPolling.bind(
        transactionController,
      ),
    stopIncomingTransactionPolling:
      transactionController.stopIncomingTransactionPolling.bind(
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
  };
}

export function initTransactionController(
  wallet: {
    getInstance: (name: 'TransactionController') => TransactionController;
  },
  request: InitializeWalletRequest,
) {
  const { messenger, getTransactionMetricsRequest } = request;

  addTransactionControllerListeners(
    getTransactionControllerInitMessenger(messenger),
    getTransactionMetricsRequest,
  );

  return wallet.getInstance('TransactionController');
}

function addTransactionControllerListeners(
  initMessenger: TransactionControllerInitMessenger,
  getTransactionMetricsRequest: () => TransactionMetricsRequest,
) {
  initMessenger.subscribe(
    'TransactionController:postTransactionBalanceUpdated',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handlePostTransactionBalanceUpdate(
        getTransactionMetricsRequest(),
        ...args,
      ),
  );

  initMessenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (transactionMeta) =>
      handleTransactionAdded(getTransactionMetricsRequest(), {
        transactionMeta,
      }),
  );

  initMessenger.subscribe(
    'TransactionController:transactionApproved',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionApproved(getTransactionMetricsRequest(), ...args),
  );

  initMessenger.subscribe(
    'TransactionController:transactionDropped',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionDropped(getTransactionMetricsRequest(), ...args),
  );

  initMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      // @ts-expect-error Error is string in metrics code but TransactionError in TransactionMeta type from controller
      handleTransactionConfirmed(getTransactionMetricsRequest(), ...args),
  );

  initMessenger.subscribe(
    'TransactionController:transactionFailed',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionFailed(getTransactionMetricsRequest(), ...args),
  );

  initMessenger.subscribe(
    'TransactionController:transactionRejected',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionRejected(getTransactionMetricsRequest(), ...args),
  );

  initMessenger.subscribe(
    'TransactionController:transactionSubmitted',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (...args) =>
      handleTransactionSubmitted(getTransactionMetricsRequest(), ...args),
  );
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

async function isEIP7702GasFeeTokensEnabled(
  dependencies: {
    getFlatState: () => MessengerClientFlatState;
    messenger: TransactionControllerInitMessenger;
  },
  transactionMeta: TransactionMeta,
) {
  const { getFlatState, messenger } = dependencies;
  const flatState = getFlatState();

  if (
    !(await accountSupports7702(
      transactionMeta.txParams?.from,
      getKeyringController(messenger),
    ))
  ) {
    return false;
  }

  const { chainId, isExternalSign } = transactionMeta;

  const isSmartTransactionEnabled = getIsSmartTransaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getUIState(flatState) as any,
    chainId,
  );

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

async function getSimulationConfig(
  dependencies: {
    messenger: TransactionControllerInitMessenger;
  },
  url: string,
  opts?: { txMeta?: TransactionMeta },
) {
  const { messenger } = dependencies;

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

function getKeyringController(messenger: TransactionControllerInitMessenger) {
  return {
    getKeyringForAccount: (address: string) =>
      messenger.call('KeyringController:getKeyringForAccount', address),
  };
}

function getUIState(flatState: MessengerClientFlatState) {
  return { metamask: flatState };
}
