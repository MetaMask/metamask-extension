import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { TransactionPayControllerMessenger } from '@metamask/transaction-pay-controller';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { TransactionControllerGetNonceLockAction } from '@metamask/transaction-controller';
import type { RootMessenger } from '../../lib/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';
import { getAssetsControllerMessenger } from './assets/assets-controller-messenger';

export function getTransactionPayControllerMessenger(
  messenger: RootMessenger,
): TransactionPayControllerMessenger {
  const controllerMessenger = new Messenger<
    'TransactionPayController',
    MessengerActions<TransactionPayControllerMessenger>,
    MessengerEvents<TransactionPayControllerMessenger>,
    typeof messenger
  >({
    namespace: 'TransactionPayController',
    parent: messenger,
  });

  // TODO: Remove this once the assets unified state is fully rolled out
  registerAssetsControllerGetStateForTransactionPayAction(
    messenger,
    controllerMessenger,
  );

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountTrackerController:getState',
      'AssetsController:getStateForTransactionPay',
      'BridgeController:fetchQuotes',
      'BridgeStatusController:submitTx',
      'CurrencyRateController:getState',
      'GasFeeController:getState',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'TokenBalancesController:getState',
      'TokenRatesController:getState',
      'TokensController:getState',
      'TransactionController:estimateGas',
      'TransactionController:estimateGasBatch',
      'TransactionController:getGasFeeTokens',
      'TransactionController:getState',
      'TransactionController:updateTransaction',
      'KeyringController:signTypedMessage',
    ],
    events: [
      'BridgeStatusController:stateChange',
      'TransactionController:stateChange',
      'TransactionController:unapprovedTransactionAdded',
    ],
  });

  return controllerMessenger;
}

type InitMessengerActions =
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction
  | TransactionControllerGetNonceLockAction;

type InitMessengerEvents = never;

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
      'DelegationController:signDelegation',
      'KeyringController:signEip7702Authorization',
      'TransactionController:getNonceLock',
    ],
    events: [],
  });

  return controllerInitMessenger;
}

function registerAssetsControllerGetStateForTransactionPayAction(
  messenger: RootMessenger,
  controllerMessenger: TransactionPayControllerMessenger,
) {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    const assetsControllerMessenger = getAssetsControllerMessenger(messenger);
    assetsControllerMessenger.registerActionHandler(
      'AssetsController:getStateForTransactionPay' as const,
      () => {
        const tokenBalancesControllerState = controllerMessenger.call(
          'TokenBalancesController:getState',
        );
        const accountsByChainIdControllerState = controllerMessenger.call(
          'AccountTrackerController:getState',
        );
        const tokensControllerState = controllerMessenger.call(
          'TokensController:getState',
        );
        const marketDataControllerState = controllerMessenger.call(
          'TokenRatesController:getState',
        );
        const currencyRatesControllerState = controllerMessenger.call(
          'CurrencyRateController:getState',
        );

        return {
          tokenBalances: tokenBalancesControllerState?.tokenBalances ?? {},
          accountsByChainId:
            accountsByChainIdControllerState?.accountsByChainId ?? {},
          allTokens: tokensControllerState?.allTokens ?? {},
          marketData: marketDataControllerState?.marketData ?? {},
          currencyRates: currencyRatesControllerState?.currencyRates ?? {},
          currentCurrency: currencyRatesControllerState?.currentCurrency ?? '',
        };
      },
    );
  }
}
