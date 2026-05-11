import {
  ActionConstraint,
  EventConstraint,
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { captureException } from '../../../shared/lib/sentry';
import type { MESSENGER_FACTORIES } from '../messenger-client-init/messengers';

export const ROOT_MESSENGER_NAMESPACE = 'Root';

type ChildMessengers = ReturnType<
  (typeof MESSENGER_FACTORIES)[keyof typeof MESSENGER_FACTORIES]['getMessenger']
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

export function getRootMessenger<
  AllowedActions extends ActionConstraint = RootMessengerActions,
  AllowedEvents extends EventConstraint = RootMessengerEvents,
>(): RootMessenger<AllowedActions, AllowedEvents> {
  return new Messenger({
    namespace: ROOT_MESSENGER_NAMESPACE,
    captureException,
  });
}
