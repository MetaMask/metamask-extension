import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { KeyringControllerGetKeyringForAccountAction } from '@metamask/keyring-controller';
import { GetSnap } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';

type AllowedActions = GetSnap | KeyringControllerGetKeyringForAccountAction;

export type SnapAndHardwareMessenger = RestrictedControllerMessenger<
  'SnapAndHardwareMessenger',
  AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

export async function getSnapAndHardwareInfoForMetrics(
  getSelectedAddress: () => string,
  getAccountType: (address: string) => Promise<string>,
  getDeviceModel: (address: string) => Promise<string>,
  messenger: SnapAndHardwareMessenger,
) {
  // If it's coming from a unit test, there's no messenger
  // Will fix this in a future PR and add proper unit tests
  if (!messenger) {
    return {};
  }

  const selectedAddress = getSelectedAddress();

  const keyring: any = await getKeyringForAccount(selectedAddress);

  const account = await getAccountFromAddress(selectedAddress);

  const snap: Snap = (await messenger.call(
    'SnapController:get',
    account?.metadata.snap.id,
  )) as Snap;

  async function getAccountFromAddress(address: string) {
    const lowercaseAddress = address.toLowerCase();

    if (keyring.listAccounts) {
      const accounts = await keyring.listAccounts();
      return accounts.find(
        (_account: any) => _account.address.toLowerCase() === lowercaseAddress,
      );
    }

    return undefined;
  }

  async function getHardwareWalletType() {
    if (keyring?.type?.includes('Hardware')) {
      return keyring.type;
    }

    return undefined;
  }

  async function getKeyringForAccount(address: string) {
    return await messenger.call(
      'KeyringController:getKeyringForAccount',
      address,
    );
  }

  return {
    account_type: await getAccountType(selectedAddress),
    device_model: await getDeviceModel(selectedAddress),
    account_hardware_type: await getHardwareWalletType(),
    account_snap_type: snap?.id,
    account_snap_version: snap?.version,
  };
}
