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
 * Create an MPC keyring and set up its network identity (without running full setup).
 * Used as the first step of the join flow.
 *
 * @param keyringController - The keyring controller instance.
 * @returns An object with the keyring ID and the party ID (device identity).
 */
export async function setupMpcIdentity(
  keyringController: KeyringController,
): Promise<{ keyringId: string; partyId: string }> {
  const { id } = await keyringController.addNewKeyring(KeyringTypes.mpc);
  const partyId = await keyringController.withKeyring(
    { id },
    async ({ keyring }) => {
      return (keyring as MPCKeyring).setupIdentity();
    },
  );
  return { keyringId: id, partyId };
}

/**
 * Join an existing MPC wallet by running setup in join mode.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring (created via setupMpcIdentity).
 * @param verifierId - The ID of the verifier.
 * @param initiator - The party ID of the initiating custodian.
 */
export async function joinMpcWallet(
  keyringController: KeyringController,
  keyringId: string,
  verifierId: string,
  initiator: string,
): Promise<void> {
  await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      await (keyring as MPCKeyring).setup({
        verifierIds: [verifierId],
        mode: 'join',
        initiator,
      });
    },
  );
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

/**
 * Add a new custodian to an MPC keyring.
 *
 * @param keyringController - The keyring controller instance.
 * @param keyringId - The ID of the MPC keyring.
 * @param custodianId - The party ID of the custodian to add.
 */
export async function addMpcCustodian(
  keyringController: KeyringController,
  keyringId: string,
  custodianId: string,
): Promise<void> {
  await keyringController.withKeyring(
    { id: keyringId },
    async ({ keyring }) => {
      await (keyring as MPCKeyring).addCustodian(custodianId);
    },
  );
}
