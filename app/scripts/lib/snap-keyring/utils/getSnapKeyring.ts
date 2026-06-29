import { SnapKeyring } from '@metamask/eth-snap-keyring';

type GetLegacySnapKeyringMessenger = {
  call: (
    actionType: 'SnapAccountService:getLegacySnapKeyring',
  ) => Promise<SnapKeyring>;
};

/**
 * Initialize the snap keyring if it is not present.
 *
 * @param messenger - Controller messenger with SnapAccountService access.
 * @returns The snap keyring instance.
 */
export async function getSnapKeyring(
  messenger: GetLegacySnapKeyringMessenger,
): Promise<SnapKeyring> {
  return messenger.call('SnapAccountService:getLegacySnapKeyring');
}
