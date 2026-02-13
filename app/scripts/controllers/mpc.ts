import { KeyringController, KeyringTypes } from '@metamask/keyring-controller';
import { MPCKeyring } from '@metamask/eth-mpc-keyring';

export type MpcCustodian = {
  id: string;
  type: 'cloud' | 'user';
};

/**
 * Extended interface for MPC keyring with custodian management methods.
 * These methods are available on the keyring but not yet declared in the MPCKeyring type.
 */
type MpcKeyringWithCustodians = MPCKeyring & {
  getCustodians(type: 'cloud' | 'user'): string[];
  getCustodianId(): string;
  addCustodian(peerId: string): Promise<void>;
};

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

/**
 * Get the list of custodians for an MPC keyring.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @returns The list of custodians with their IDs and types.
 */
export async function getMpcCustodians(
  keyringController: KeyringController,
  keyringId: string,
): Promise<MpcCustodian[]> {
  return await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      const mpcKeyring = keyring as MpcKeyringWithCustodians;
      const cloudCustodians = mpcKeyring.getCustodians('cloud');
      const userCustodians = mpcKeyring.getCustodians('user');

      return [
        ...cloudCustodians.map((id: string) => ({
          id,
          type: 'cloud' as const,
        })),
        ...userCustodians.map((id: string) => ({
          id,
          type: 'user' as const,
        })),
      ];
    },
  );
}

/**
 * Get the custodian ID for the current user on an MPC keyring.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @returns The custodian ID for the current user.
 */
export async function getMpcCustodianId(
  keyringController: KeyringController,
  keyringId: string,
): Promise<string> {
  return await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      return (keyring as MpcKeyringWithCustodians).getCustodianId();
    },
  );
}

/**
 * Add a new custodian to an MPC keyring.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @param peerId - The peer ID of the custodian to add.
 */
export async function addMpcCustodian(
  keyringController: KeyringController,
  keyringId: string,
  peerId: string,
): Promise<void> {
  await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      await (keyring as MpcKeyringWithCustodians).addCustodian(peerId);
    },
  );
}
