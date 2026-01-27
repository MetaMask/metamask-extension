//========
// A file that defines the UI messenger could look something like this. (See
// `ui/index.js` for where `getUIMessenger` is called.) Once constructed, the UI
// messenger would be passed down the React component tree, where it would serve
// as the parent for more specific messengers.
//========

import { ActionConstraint, Messenger } from '@metamask/messenger';
import { AccountTreeControllerSelectedAccountGroupChangeEvent } from '@metamask/account-tree-controller';
import { AssetsContractControllerGetBalancesInSingleCallAction } from '@metamask/assets-contract-controller';
import { KeyringControllerUnlockEvent } from '@metamask/keyring-controller';
import { GasFeeControllerStartPollingAction } from '@metamask/gas-fee-controller';
import { PreferencesControllerSetUsePhishDetectAction } from '@metamask/preferences-controller';
import { TransactionControllerUpdateEditableParamsAction } from '@metamask/transaction-controller';

import {
  WalletServiceGetCodeAction,
  WalletServiceAddNewAccountAction,
  // We are not using any functionality.
  // eslint-disable-next-line import/no-restricted-paths
} from '../../app/scripts/services/wallet-service';
import { AppStateControllerSetDefaultHomeActiveTabAction } from '../../app/scripts/controller-init/app-state-controller';
import { MetaMetricsControllerSetParticipateInMetricsAction } from '../../app/scripts/controller-init/metametrics-controller';
import {
  ROOT_MESSENGER_NAMESPACE,
  RootMessengerActionRegistry,
  // We are not using any functionality.
  // eslint-disable-next-line import/no-restricted-paths
} from '../../app/scripts/lib/messenger';
// We are not using any functionality.
// eslint-disable-next-line import/no-restricted-paths
import type { MetaRPCClient } from '../../app/scripts/lib/metaRPCClientFactory';

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes a function asynchronous.
 */
type Asynchronize<Fun extends (...args: never[]) => unknown> = Fun extends (
  ...args: infer Args
) => infer Return
  ? (...args: Args) => Promise<Awaited<Return>>
  : never;

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes the given actions asynchronous.
 */
type AsynchronizeActions<Action extends ActionConstraint> = {
  type: Action['type'];
  handler: Asynchronize<Action['handler']>;
};

type Actions = AsynchronizeActions<
  | AppStateControllerSetDefaultHomeActiveTabAction
  | AssetsContractControllerGetBalancesInSingleCallAction
  | GasFeeControllerStartPollingAction
  | MetaMetricsControllerSetParticipateInMetricsAction
  | PreferencesControllerSetUsePhishDetectAction
  | TransactionControllerUpdateEditableParamsAction
  | WalletServiceGetCodeAction
  | WalletServiceAddNewAccountAction
>;

type Events =
  | AccountTreeControllerSelectedAccountGroupChangeEvent
  | KeyringControllerUnlockEvent;

export type UIMessenger = Messenger<'UI', Actions, Events>;

const ACTIONS = [
  'AppStateController:setDefaultHomeActiveTab',
  'AssetsContractController:getBalancesInSingleCall',
  'GasFeeController:startPolling',
  'MetaMetricsController:setParticipateInMetrics',
  'PreferencesController:setUsePhishDetect',
  'TransactionController:updateEditableParams',
  'WalletService:checkHardwareStatus',
  'WalletService:forgetDevice',
  // ...
] as const;

const EVENTS = [
  'AccountTreeController:selectedAccountGroupChange',
  'KeyringController:unlock',
  // ...
] as const;

export async function getUIMessenger(
  //========
  // The type of this argument is now a direct instance of `MetaRPCClient`
  // rather than a proxy around it.
  //========
  backgroundConnection: MetaRPCClient<RootMessengerActionRegistry>,
): Promise<UIMessenger> {
  const uiMessenger: UIMessenger = new Messenger({
    namespace: 'UI',
  });

  for (const action of ACTIONS) {
    uiMessenger.registerActionHandler(action, async (...args: unknown[]) => {
      return await backgroundConnection.send({
        method: action,
        params: args,
      });
    });
  }

  backgroundConnection.onNotification(({ method, params }) => {
    if (
      method === 'callEventListener' &&
      params !== undefined &&
      'eventName' in params &&
      typeof params.eventName === 'string' &&
      'eventPayload' in params &&
      Array.isArray(params.eventPayload)
    ) {
      // @ts-expect-error The UI messenger will check that the event is valid at
      // runtime.
      uiMessenger.publish(params.eventName, ...params.eventPayload);
    }
  });

  for (const event of EVENTS) {
    await backgroundConnection.send({
      method: `${ROOT_MESSENGER_NAMESPACE}:listen`,
      params: event,
    });
  }

  return uiMessenger;
}
