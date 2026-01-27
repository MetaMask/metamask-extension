import {
  ActionConstraint,
  EventConstraint,
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';

export type ExtractMessengerActions<
  SomeMessenger extends Messenger<string, ActionConstraint, EventConstraint>,
  ActionTypes extends readonly MessengerActions<SomeMessenger>['type'][],
> = Extract<MessengerActions<SomeMessenger>, { type: ActionTypes[number] }>;

export type ExtractMessengerEvents<
  SomeMessenger extends Messenger<string, ActionConstraint, EventConstraint>,
  EventTypes extends readonly MessengerEvents<SomeMessenger>['type'][],
> = Extract<MessengerEvents<SomeMessenger>, { type: EventTypes[number] }>;
