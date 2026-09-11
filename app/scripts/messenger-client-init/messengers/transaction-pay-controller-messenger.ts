import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { TransactionPayControllerMessenger } from '@metamask/transaction-pay-controller';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type { MoneyAccountControllerGetMoneyAccountAction } from '@metamask/money-account-controller';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  TransactionControllerAddTransactionBatchAction,
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetStateAction,
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionControllerUpdateTransactionAction,
} from '@metamask/transaction-controller';
import type { RootMessenger } from '../../lib/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';
import { getAssetsControllerMessenger } from './assets/assets-controller-messenger';
import { registerAccountTrackerGetStateCompat } from './account-tracker-controller-compat';
import { registerCurrencyRateGetStateCompat } from './currency-rate-controller-compat';
import { registerTokensControllerGetStateCompat } from './tokens-controller-compat';

type TokenBalancesCompatState = {
  tokenBalances: Record<string, Record<string, Record<string, `0x${string}`>>>;
};

const EMPTY_TOKEN_BALANCES_STATE: TokenBalancesCompatState = {
  tokenBalances: {},
};

type TokenRatesCompatState = {
  marketData: Record<string, Record<string, unknown>>;
};

const EMPTY_TOKEN_RATES_STATE: TokenRatesCompatState = {
  marketData: {},
};

type CompatRootMessenger = {
  call: (actionType: string, ...args: unknown[]) => unknown;
};

/**
 * Derive TokenBalancesController-shaped state from AssetsController so
 * transaction-pay-controller can keep calling TokenBalancesController:getState
 * when the assets-unify remote flag is off.
 *
 * @param messenger - Root messenger used to read AssetsController state.
 * @returns Compat state with `tokenBalances`.
 */
function getTokenBalancesCompatState(
  messenger: CompatRootMessenger,
): TokenBalancesCompatState {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return EMPTY_TOKEN_BALANCES_STATE;
  }

  try {
    const transactionPayState = messenger.call(
      'AssetsController:getStateForTransactionPay',
    ) as TokenBalancesCompatState | undefined;
    return {
      tokenBalances: transactionPayState?.tokenBalances ?? {},
    };
  } catch {
    return EMPTY_TOKEN_BALANCES_STATE;
  }
}

/**
 * Register a TokenBalancesController:getState shim backed by AssetsController
 * so TransactionPayController keeps working after TokenBalancesController removal.
 *
 * @param messenger - The root messenger.
 */
function registerTokenBalancesGetStateCompat(messenger: RootMessenger): void {
  const compatMessenger = new Messenger({
    namespace: 'TokenBalancesController',
    parent: messenger,
  });
  // Namespace messenger has no built-in action types; register the compat getState.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (compatMessenger as any).registerActionHandler(
    'TokenBalancesController:getState',
    () =>
      getTokenBalancesCompatState(messenger as unknown as CompatRootMessenger),
  );
}

/**
 * Derive TokenRatesController-shaped state from AssetsController so
 * transaction-pay-controller can keep calling TokenRatesController:getState
 * when the assets-unify remote flag is off.
 *
 * @param messenger - Root messenger used to read AssetsController state.
 * @returns Compat state with `marketData`.
 */
function getTokenRatesCompatState(
  messenger: CompatRootMessenger,
): TokenRatesCompatState {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return EMPTY_TOKEN_RATES_STATE;
  }

  try {
    const transactionPayState = messenger.call(
      'AssetsController:getStateForTransactionPay',
    ) as TokenRatesCompatState | undefined;
    return {
      marketData: transactionPayState?.marketData ?? {},
    };
  } catch {
    return EMPTY_TOKEN_RATES_STATE;
  }
}

/**
 * Register a TokenRatesController:getState shim backed by AssetsController
 * so TransactionPayController keeps working after TokenRatesController removal.
 *
 * @param messenger - The root messenger.
 */
function registerTokenRatesGetStateCompat(messenger: RootMessenger): void {
  const compatMessenger = new Messenger({
    namespace: 'TokenRatesController',
    parent: messenger,
  });
  // Namespace messenger has no built-in action types; register the compat getState.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (compatMessenger as any).registerActionHandler(
    'TokenRatesController:getState',
    () => getTokenRatesCompatState(messenger as unknown as CompatRootMessenger),
  );
}

export function getTransactionPayControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<TransactionPayControllerMessenger>,
    MessengerEvents<TransactionPayControllerMessenger>
  >,
): TransactionPayControllerMessenger {
  // Compat shims: transaction-pay-controller still requests
  // AccountTrackerController:getState / TokenBalancesController:getState /
  // TokenRatesController:getState / CurrencyRateController:getState /
  // TokensController:getState when assets-unify remote flag is off.
  registerAccountTrackerGetStateCompat(messenger as RootMessenger);
  registerTokenBalancesGetStateCompat(messenger as RootMessenger);
  registerTokenRatesGetStateCompat(messenger as RootMessenger);
  registerCurrencyRateGetStateCompat(messenger as RootMessenger);
  registerTokensControllerGetStateCompat(messenger as RootMessenger);

  const controllerMessenger: TransactionPayControllerMessenger = new Messenger({
    namespace: 'TransactionPayController',
    parent: messenger,
  });

  // TODO: Remove this once the assets unified state is fully rolled out
  registerAssetsControllerGetStateForTransactionPayAction(messenger);

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      // Compat shim: derives accountsByChainId from AssetsController.
      'AccountTrackerController:getState',
      'AssetsController:getStateForTransactionPay',
      // Compat shim: derives currencyRates / currentCurrency from AssetsController.
      'CurrencyRateController:getState',
      'GasFeeController:getState',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByChainId',
      'RemoteFeatureFlagController:getState',
      // Compat shim: derives tokenBalances from AssetsController.
      'TokenBalancesController:getState',
      // Compat shim: derives marketData from AssetsController.
      'TokenRatesController:getState',
      // Compat shim: derives allTokens / allIgnoredTokens from AssetsController.
      'TokensController:getState',
      'TransactionController:estimateGas',
      'TransactionController:estimateGasBatch',
      'TransactionController:getGasFeeTokens',
      'TransactionController:getState',
      'TransactionController:updateTransaction',
      'KeyringController:getState',
      'KeyringController:signTypedMessage',
      'RampsController:getOrder',
      'RampsController:getQuotes',
      'SentinelApiService:simulateTransactions',
    ],
    events: [
      'AssetsController:stateChange',
      // Kept for transaction-pay-controller subscriptions; no publisher after
      // CurrencyRateController removal (AssetsController:stateChange covers unify).
      'CurrencyRateController:stateChange',
      // Kept for transaction-pay-controller subscriptions; no publisher after
      // TokenRatesController removal (AssetsController:stateChange covers unify).
      'TokenRatesController:stateChange',
      // Kept for transaction-pay-controller subscriptions; no publisher after
      // TokensController removal (AssetsController:stateChange covers unify).
      'TokensController:stateChange',
      'TransactionController:stateChange',
      'TransactionController:unapprovedTransactionAdded',
    ],
  });

  return controllerMessenger;
}

type InitMessengerActions =
  | AccountsControllerGetSelectedAccountAction
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerGetStateAction
  | TransactionControllerIsAtomicBatchSupportedAction
  | TransactionControllerUpdateTransactionAction
  | MoneyAccountControllerGetMoneyAccountAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | TransactionControllerAddTransactionBatchAction;

type InitMessengerEvents = TransactionControllerUnapprovedTransactionAddedEvent;

export type TransactionPayControllerInitMessenger = ReturnType<
  typeof getTransactionPayControllerInitMessenger
>;

export function getTransactionPayControllerInitMessenger(
  messenger: RootMessenger<InitMessengerActions, InitMessengerEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'TransactionPayControllerInit',
    InitMessengerActions,
    InitMessengerEvents,
    typeof messenger
  >({
    namespace: 'TransactionPayControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'DelegationController:signDelegation',
      'KeyringController:signEip7702Authorization',
      'MoneyAccountController:getMoneyAccount',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'TransactionController:addTransactionBatch',
      'TransactionController:getNonceLock',
      'TransactionController:getState',
      'TransactionController:isAtomicBatchSupported',
      'TransactionController:updateTransaction',
    ],
    events: ['TransactionController:unapprovedTransactionAdded'],
  });

  return controllerInitMessenger;
}

function registerAssetsControllerGetStateForTransactionPayAction(
  messenger: RootMessenger,
) {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    const assetsControllerMessenger = getAssetsControllerMessenger(messenger);
    assetsControllerMessenger.registerActionHandler(
      'AssetsController:getStateForTransactionPay' as const,
      () => {
        return {
          // AccountTrackerController / TokenBalancesController /
          // TokenRatesController / CurrencyRateController / TokensController
          // are removed; empty maps when unify is not in build.
          tokenBalances: {},
          accountsByChainId: {},
          allTokens: {},
          marketData: {},
          currencyRates: {},
          currentCurrency: '',
        };
      },
    );
  }
}
