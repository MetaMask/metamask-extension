//========
// A file that defines the UI messenger could look something like this. (See
// `ui/index.js` for where `getUIMessenger` is called.) Once constructed, the UI
// messenger would be passed down the React component tree, where it would serve
// as the parent for more specific messengers.
//========

import { ActionConstraint, Messenger } from '@metamask/messenger';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { KeyringControllerUnlockEvent } from '@metamask/keyring-controller';
import { ShieldControllerCheckCoverageAction } from '@metamask/shield-controller';

import * as accountTreeController from '../../shared/messenger-config/account-tree-controller';
import * as keyringController from '../../shared/messenger-config/keyring-controller';
import * as notificationServicesController from '../../shared/messenger-config/notification-services-controller';
import * as rewardsController from '../../shared/messenger-config/rewards-controller';
import * as shieldController from '../../shared/messenger-config/shield-controller';
import * as walletService from '../../shared/messenger-config/wallet-service';
import { BackgroundRpcClient } from '../store/background-connection';

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes a function asynchronous.
 */
type Asynchronize<Fn extends (...args: never[]) => unknown> = Fn extends (
  ...args: infer Args
) => infer Return
  ? (...args: Args) => Promise<Awaited<Return>>
  : never;

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes the given actions asynchronous.
 */
type AsynchronizeActions<Action> = Action extends ActionConstraint
  ? {
      type: Action['type'];
      handler: Asynchronize<Action['handler']>;
    }
  : never;

type Actions = AsynchronizeActions<
  | accountTreeController.UIActions
  | keyringController.UIActions
  | notificationServicesController.UIActions
  | rewardsController.UIActions
  | shieldController.UIActions
  | walletService.UIActions
>;

type Events =
  | accountTreeController.UIEvents
  | keyringController.UIEvents
  | notificationServicesController.UIEvents
  | rewardsController.UIEvents
  | shieldController.UIEvents
  | walletService.UIEvents;

export type UIMessenger = Messenger<'UI', Actions, Events>;

const ACTIONS = [
  ...accountTreeController.UI_ACTIONS,
  ...notificationServicesController.UI_ACTIONS,
  ...rewardsController.UI_ACTIONS,
  ...shieldController.UI_ACTIONS,
  ...walletService.UI_ACTIONS,
  // ...
] as const;

const EVENTS = [
  ...accountTreeController.UI_EVENTS,
  ...keyringController.UI_EVENTS,
  ...notificationServicesController.UI_EVENTS,
  ...rewardsController.UI_EVENTS,
  ...walletService.UI_EVENTS,
  // ...
] as const;

function isKnownEvent(eventName: string): eventName is (typeof EVENTS)[number] {
  const events: readonly string[] = EVENTS;
  return events.includes(eventName);
}

export async function getUIMessenger(
  backgroundConnection: BackgroundRpcClient,
): Promise<UIMessenger> {
  const uiMessenger: UIMessenger = new Messenger({
    namespace: 'UI',
  });

  for (const action of ACTIONS) {
    const handler = async (...args: Parameters<Actions['handler']>) => {
      return await backgroundConnection.call({
        method: action,
        params: args,
      });
    };
    // We intentionally use this method even though it's marked as deprecated,
    // because we are simulating delegation.
    uiMessenger._internalRegisterDelegatedActionHandler(
      action,
      // @ts-expect-error The type of the handler for this method is something
      // that TypeScript wouldn't be able to infer.
      handler,
    );
  }

  backgroundConnection.onNotification(({ method, params }) => {
    if (
      method === 'callEventListener' &&
      params !== undefined &&
      'eventName' in params &&
      typeof params.eventName === 'string' &&
      'eventPayload' in params &&
      Array.isArray(params.eventPayload) &&
      isKnownEvent(params.eventName)
    ) {
      // We intentionally use this method even though it's marked as deprecated,
      // because we are simulating delegation.
      uiMessenger._internalPublishDelegated(
        params.eventName,
        // @ts-expect-error All TypeScript knows is that the payload is some
        // kind of JSON, but we can trust this is the right payload for the
        // event.
        ...params.eventPayload,
      );
    }
  });

  for (const event of EVENTS) {
    await backgroundConnection.call({
      method: `Root:listen`,
      params: event,
    });
  }

  return uiMessenger;
}
