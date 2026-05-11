import { MessengerActions } from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';
import {
  getSnapKeyringBuilderInitMessenger,
  getSnapKeyringBuilderMessenger,
} from './snap-keyring-builder-messenger';

export type SnapKeyringBuilderMessenger = ReturnType<
  typeof getSnapKeyringBuilderMessenger
>;

export type SnapKeyringBuilderInitMessenger = ReturnType<
  typeof getSnapKeyringBuilderInitMessenger
>;

export type SnapKeyringBuilderV2Messenger = ReturnType<
  typeof getSnapKeyringBuilderV2Messenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * v2 Snap keyring.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapKeyringBuilderV2Messenger(
  messenger: RootMessenger<
    MessengerActions<SnapKeyringBuilderMessenger>,
    never
  >,
) {
  // We re-use the same messenger to preserve the same namespace and avoid duplicating the events
  // and actions of the Snap keyring v2 for ALL consumers.
  return getSnapKeyringBuilderMessenger(messenger);
}

export type SnapKeyringBuilderV2InitMessenger = ReturnType<
  typeof getSnapKeyringBuilderV2InitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the v2 Snap keyring.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSnapKeyringBuilderV2InitMessenger(
  messenger: RootMessenger<
    MessengerActions<SnapKeyringBuilderInitMessenger>,
    never
  >,
) {
  // Same here, v2 Snap keyrings are built the same way as v1, so we can re-use the same messenger.
  return getSnapKeyringBuilderInitMessenger(messenger);
}
