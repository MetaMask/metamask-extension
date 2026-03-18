//========
// We modify the file that defines RootMessenger so that we have a registry of
// ALL actions and events that are registered on the root messenger. We need
// this to define a type for the background connection object.
//========

import {
  ActionConstraint,
  EventConstraint,
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { CONTROLLER_MESSENGERS } from '../controller-init/messengers';
import { captureException } from '../../../shared/lib/sentry';

export const ROOT_MESSENGER_NAMESPACE = 'Root';

type ChildMessengers = ReturnType<
  (typeof CONTROLLER_MESSENGERS)[keyof typeof CONTROLLER_MESSENGERS]['getMessenger']
>;

// We export this separately from RootMessenger because we can't get it from
// RootMessenger like we can with other kinds of messengers.
export type RootMessengerActions = MessengerActions<ChildMessengers>;

// We export this separately from RootMessenger because we can't get it from
// RootMessenger like we can with other kinds of messengers.
export type RootMessengerEvents = MessengerEvents<ChildMessengers>;

export type RootMessenger<
  AllowedActions extends ActionConstraint = ActionConstraint,
  AllowedEvents extends EventConstraint = EventConstraint,
> = Messenger<typeof ROOT_MESSENGER_NAMESPACE, AllowedActions, AllowedEvents>;

export function getRootMessenger(): RootMessenger<
  RootMessengerActions,
  RootMessengerEvents
> {
  return new Messenger({
    namespace: ROOT_MESSENGER_NAMESPACE,
    captureException,
  });
}
