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

type AllMessengers = ReturnType<
  (typeof CONTROLLER_MESSENGERS)[keyof typeof CONTROLLER_MESSENGERS]['getMessenger']
>;

export type AllRootMessengerActions = MessengerActions<AllMessengers>;

export type AllRootMessengerEvents = MessengerEvents<AllMessengers>;

export type RootMessenger<
  AllowedActions extends ActionConstraint = ActionConstraint,
  AllowedEvents extends EventConstraint = EventConstraint,
> = Messenger<typeof ROOT_MESSENGER_NAMESPACE, AllowedActions, AllowedEvents>;

export type RootMessengerActionRegistry = {
  [Action in AllRootMessengerActions as Action['type']]: Action['handler'];
};

export function getRootMessenger(): RootMessenger<
  AllRootMessengerActions,
  AllRootMessengerEvents
> {
  return new Messenger({
    namespace: ROOT_MESSENGER_NAMESPACE,
    captureException,
  });
}
