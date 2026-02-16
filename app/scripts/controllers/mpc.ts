import { KeyringController, KeyringTypes } from '@metamask/keyring-controller';
import { MPCKeyring } from '@metamask/eth-mpc-keyring';
import type { Custodian } from '@metamask/eth-mpc-keyring';

export type { Custodian } from '@metamask/eth-mpc-keyring';

/**
 * Create a new MPC keyring and run the full setup (create mode).
 *
 * @param keyringController - The keyring controller instance.
 * @param verifierId - The ID of the verifier.
 * @returns The keyring ID.
 */
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
 * Generate join data for a new custodian to join an existing MPC wallet.
 * Called by the initiator.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @returns Serialized join data string.
 */
export async function createMpcJoinData(
  keyringController: KeyringController,
  keyringId: string,
): Promise<string> {
  return await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      return (keyring as MPCKeyring).createJoinData();
    },
  );
}

/**
 * Add a new custodian to an MPC keyring using join data.
 * Called by the initiator after createJoinData.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @param joinData - The serialized join data from createJoinData.
 */
export async function addMpcCustodian(
  keyringController: KeyringController,
  keyringId: string,
  joinData: string,
): Promise<void> {
  await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      await (keyring as MPCKeyring).addCustodian(joinData);
    },
  );
}

/**
 * Join an existing MPC wallet using join data from the initiator.
 * Creates a new keyring and runs setup in join mode.
 *
 * @param keyringController - The keyring controller instance.
 * @param verifierId - The ID of the verifier.
 * @param joinData - The serialized join data from the initiator.
 * @returns The keyring ID.
 */
export async function joinMpcWallet(
  keyringController: KeyringController,
  verifierId: string,
  joinData: string,
): Promise<string> {
  const { id } = await keyringController.addNewKeyring(KeyringTypes.mpc);
  await keyringController.withKeyring({ id }, async ({ keyring }) => {
    await (keyring as MPCKeyring).setup({
      verifierIds: [verifierId],
      mode: 'join',
      joinData,
    });
  });
  return id;
}

/**
 * Get the list of custodians for an MPC keyring.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @returns The list of custodians with their party IDs and types.
 */
export async function getMpcCustodians(
  keyringController: KeyringController,
  keyringId: string,
): Promise<Custodian[]> {
  return await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      return (keyring as MPCKeyring).getCustodians();
    },
  );
}

/**
 * Get the custodian ID for the current user on an MPC keyring.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @returns The custodian ID (party ID) for the current user.
 */
export async function getMpcCustodianId(
  keyringController: KeyringController,
  keyringId: string,
): Promise<string> {
  return await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      return (keyring as MPCKeyring).getCustodianId();
    },
  );
}
