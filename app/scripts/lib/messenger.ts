import {
  ActionConstraint,
  EventConstraint,
  Messenger,
} from '@metamask/messenger';

export const ROOT_MESSENGER_NAMESPACE = 'Root';

export type RootMessenger<
  AllowedActions extends ActionConstraint = ActionConstraint,
  AllowedEvents extends EventConstraint = EventConstraint,
> = Messenger<typeof ROOT_MESSENGER_NAMESPACE, AllowedActions, AllowedEvents>;

export const getRootMessenger = <
  AllowedActions extends ActionConstraint = ActionConstraint,
  AllowedEvents extends EventConstraint = EventConstraint,
>(): RootMessenger<AllowedActions, AllowedEvents> => {
  return new Messenger({
    namespace: ROOT_MESSENGER_NAMESPACE,
  });
};
