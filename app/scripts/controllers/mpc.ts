import { KeyringController, KeyringTypes } from '@metamask/keyring-controller';
import { MPCKeyring } from '@metamask/eth-mpc-keyring';

export async function createMpcKeyring(
  keyringController: KeyringController,
  verifierId: string,
) {
  const { id } = await keyringController.addNewKeyring(KeyringTypes.mpc);
  await keyringController.withKeyring({ id }, async ({ keyring }) => {
    await (keyring as MPCKeyring).setup({ verifierIds: [verifierId] });
  });
  return id;
}
