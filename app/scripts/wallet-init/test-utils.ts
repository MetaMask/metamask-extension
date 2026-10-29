import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type ActionConstraint,
  type EventConstraint,
  type MessengerActions,
  type MessengerEvents,
  type MockAnyNamespace,
} from '@metamask/messenger';
import type { WalletInitMessenger } from './types';

/**
 * Build a root messenger for tests. `MOCK_ANY_NAMESPACE` disables namespace
 * checks so a real `Messenger` can stand in for the client root messenger
 * without casting. The action/event type parameters still have to be concrete
 * for the messenger to be assignable to a typed parameter, so they default to
 * what `initializeWallet` expects; override them for other call sites.
 *
 * @returns A messenger usable wherever a `WalletInitMessenger` is expected.
 */
export function createMockMessenger<
  Actions extends ActionConstraint = MessengerActions<WalletInitMessenger>,
  Events extends EventConstraint = MessengerEvents<WalletInitMessenger>,
>() {
  return new Messenger<MockAnyNamespace, Actions, Events>({
    namespace: MOCK_ANY_NAMESPACE,
  });
}
