//========
// A file that defines the UI messenger could look something like this. (See
// `ui/index.js` for where `getUIMessenger` is called.) Once constructed, the UI
// messenger would be passed down the React component tree, where it would serve
// as the parent for more specific messengers.
//========
//========
// We amend this file to add `network-controller` actions and events to the UI
// messenger, as they weren't present before. We also expose the actions and
// events available to the UI.
//========

import type { ActionConstraint } from '@metamask/messenger';
import { Messenger } from '@metamask/messenger';

// We are only using the type here (though this should probably be in shared/).
// eslint-disable-next-line import/no-restricted-paths
import type { MetaRPCClient } from '../../app/scripts/lib/metaRPCClientFactory';
import * as accountTreeController from '../../shared/messenger-config/account-tree-controller';
import * as bridgeController from '../../shared/messenger-config/bridge-controller';
import * as keyringController from '../../shared/messenger-config/keyring-controller';
import * as networkController from '../../shared/messenger-config/network-controller';
import * as notificationServicesController from '../../shared/messenger-config/notification-services-controller';
import * as rewardsController from '../../shared/messenger-config/rewards-controller';
import * as shieldController from '../../shared/messenger-config/shield-controller';
import * as walletService from '../../shared/messenger-config/wallet-service';
import type { RootMessengerActionRegistry } from '../../shared/types/root-messenger-action-registry';

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes a function asynchronous.
 */
type MakeAsynchronous<InputFunction extends (...args: never[]) => unknown> =
  InputFunction extends (...args: infer Args) => infer Return
    ? (...args: Args) => Promise<Awaited<Return>>
    : never;

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes the given actions asynchronous.
 */
type MakeActionsAsynchronous<Action> = Action extends ActionConstraint
  ? {
      type: Action['type'];
      handler: MakeAsynchronous<Action['handler']>;
    }
  : never;

export type UIMessengerActions = MakeActionsAsynchronous<
  | accountTreeController.UIActions
  | bridgeController.UIActions
  | keyringController.UIActions
  | networkController.UIActions
  | notificationServicesController.UIActions
  | rewardsController.UIActions
  | shieldController.UIActions
  | walletService.UIActions
>;

export type UIMessengerEvents =
  | accountTreeController.UIEvents
  | bridgeController.UIEvents
  | keyringController.UIEvents
  | networkController.UIEvents
  | notificationServicesController.UIEvents
  | rewardsController.UIEvents
  | shieldController.UIEvents
  | walletService.UIEvents;

export type UIMessenger = Messenger<
  'UI',
  UIMessengerActions,
  UIMessengerEvents
>;

const ACTIONS = [
  ...accountTreeController.UI_ACTIONS,
  ...bridgeController.UI_ACTIONS,
  ...keyringController.UI_ACTIONS,
  ...networkController.UI_ACTIONS,
  ...notificationServicesController.UI_ACTIONS,
  ...rewardsController.UI_ACTIONS,
  ...shieldController.UI_ACTIONS,
  ...walletService.UI_ACTIONS,
  // ...
] as const;

const EVENTS = [
  ...accountTreeController.UI_EVENTS,
  ...bridgeController.UI_EVENTS,
  ...keyringController.UI_EVENTS,
  ...networkController.UI_EVENTS,
  ...notificationServicesController.UI_EVENTS,
  ...rewardsController.UI_EVENTS,
  ...shieldController.UI_EVENTS,
  ...walletService.UI_EVENTS,
  // ...
] as const;

function isKnownEvent(eventName: string): eventName is (typeof EVENTS)[number] {
  const events: readonly string[] = EVENTS;
  return events.includes(eventName);
}

export async function getUIMessenger(
  //========
  // The type of this argument is now a direct instance of `MetaRPCClient`
  // rather than a proxy around it.
  //========
  // @ts-expect-error The type of `NetworkController:getNetworkClientById` is
  // not JSON-compatible. We will have to fix this.
  backgroundConnection: MetaRPCClient<RootMessengerActionRegistry>,
): Promise<UIMessenger> {
  const uiMessenger: UIMessenger = new Messenger({
    namespace: 'UI',
  });

  for (const action of ACTIONS) {
    const handler = async (
      ...args: Parameters<UIMessengerActions['handler']>
    ) => {
      return await backgroundConnection.send({
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
        ...params.eventPayload,
      );
    }
  });

  for (const event of EVENTS) {
    await backgroundConnection.send({
      method: `Root:listen`,
      // @ts-expect-error Not sure why TypeScript thinks this a string.
      params: event,
    });
  }

  return uiMessenger;
}
