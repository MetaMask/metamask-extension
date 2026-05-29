import { SnapKeyring } from '@metamask/eth-snap-keyring';
import {
  KeyringControllerAddNewKeyringAction,
  KeyringControllerGetKeyringsByTypeAction,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { Messenger } from '@metamask/messenger';

/**
 * Initialize the snap keyring if it is not present.
 *
 * @param messenger
 * @returns The snap keyring instance.
 */
export async function getSnapKeyring(
  messenger: Messenger<
    string,
    | KeyringControllerGetKeyringsByTypeAction
    | KeyringControllerAddNewKeyringAction,
    never
  >,
): Promise<SnapKeyring> {
  let [snapKeyring] = messenger.call(
    'KeyringController:getKeyringsByType',
    KeyringTypes.snap,
  );

  if (!snapKeyring) {
    await messenger.call('KeyringController:addNewKeyring', KeyringTypes.snap);

    [snapKeyring] = messenger.call(
      'KeyringController:getKeyringsByType',
      KeyringTypes.snap,
    );
  }

  return snapKeyring as SnapKeyring;
}
