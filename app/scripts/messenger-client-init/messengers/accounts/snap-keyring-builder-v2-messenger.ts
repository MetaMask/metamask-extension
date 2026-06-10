import { MessengerActions } from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';
import {
  getSnapKeyringBuilderMessenger,
  SnapKeyringBuilderMessenger,
} from './snap-keyring-builder-messenger';

export type SnapKeyringV2BuilderMessenger = ReturnType<
  typeof getSnapKeyringV2BuilderMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * v2 Snap keyring.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapKeyringV2BuilderMessenger(
  messenger: RootMessenger<
    MessengerActions<SnapKeyringBuilderMessenger>,
    never
  >,
) {
  // We re-use the same messenger to preserve the same namespace and avoid duplicating the events
  // and actions of the Snap keyring v2 for ALL consumers.
  return getSnapKeyringBuilderMessenger(messenger);
}
