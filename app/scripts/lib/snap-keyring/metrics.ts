import { RestrictedControllerMessenger } from '@metamask/base-controller';

export default async function getSnapAndHardwareInfoForMetrics(
  selectedAddress: string,
  getAccountType: (address: string) => Promise<string>,
  getDeviceModel: (address: string) => Promise<string>,
  messenger: RestrictedControllerMessenger,
) {
  // If it's coming from a unit test, there's no messenger
  // Will fix this in a future PR and add proper unit tests
  if (!messenger) {
    return {};
  }

  const keyring: any = await getKeyringForAccount(selectedAddress);

  const account = await getAccountFromAddress(selectedAddress);

  const snap = await messenger.call(
    'SnapController:get',
    account?.metadata.snap.id,
  );

  async function getAccountFromAddress(address: string) {
    if (keyring.listAccounts) {
      const accounts = await keyring.listAccounts();
      return accounts.find((_account: any) => _account.address === address);
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
