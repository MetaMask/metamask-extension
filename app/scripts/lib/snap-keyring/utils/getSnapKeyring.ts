import { SnapKeyring } from '@metamask/eth-snap-keyring';
import {
  SnapAccountServiceGetLegacySnapKeyringAction,
} from '@metamask/snap-account-service';
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
    SnapAccountServiceGetLegacySnapKeyringAction,
    never
  >,
): Promise<SnapKeyring> {
  return await messenger.call('SnapAccountService:getLegacySnapKeyring');
}
