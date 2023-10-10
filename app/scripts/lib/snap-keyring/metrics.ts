import MetamaskController from '../../metamask-controller';

export default async function getSnapAndHardwareInfoForMetrics(
  metamaskController: MetamaskController,
) {
  if (!metamaskController?.preferencesController) {
    return {}; // if it's coming from a unit test, there's no metamaskController or preferencesController
  }

  const selectedAddress: string =
    metamaskController.preferencesController.getSelectedAddress();

  const keyring: any = await getKeyringForAccount(selectedAddress);

  const account = await getAccountFromAddress(selectedAddress);

  const truncatedSnap = metamaskController.snapController.getTruncated(
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
    return await metamaskController.keyringController.getKeyringForAccount(
      address,
    );
  }

  return {
    account_type: await metamaskController.getAccountType(selectedAddress),
    device_model: await metamaskController.getDeviceModel(selectedAddress),
    account_hardware_type: await getHardwareWalletType(),
    account_snap_type: truncatedSnap?.id,
    account_snap_version: truncatedSnap?.version,
  };
}
