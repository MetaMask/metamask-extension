import { KeyringController, KeyringTypes } from '@metamask/keyring-controller';
import { MPCKeyring } from '@metamask/eth-mpc-keyring';
import type { Custodian } from '@metamask/eth-mpc-keyring';

export type { Custodian } from '@metamask/eth-mpc-keyring';

/**
 * Build the MPC wallet API bound to a KeyringController instance.
 * The returned object can be spread directly into the background API.
 *
 * @param keyringController - The keyring controller instance.
 * @returns An object with all MPC wallet API methods.
 */
export function getMpcApi(keyringController: KeyringController) {
  async function createMpcKeyring(verifierId: string) {
    const { id } = await keyringController.addNewKeyring(KeyringTypes.mpc);
    await keyringController.withKeyring({ id }, async ({ keyring }) => {
      await (keyring as MPCKeyring).setup({ verifierIds: [verifierId] });
    });
    return id;
  }

  async function createMpcJoinData(keyringId: string): Promise<string> {
    return await keyringController.withKeyring(
      { id: keyringId },
      async ({ keyring }) => {
        return (keyring as MPCKeyring).createJoinData();
      },
    );
  }

  async function addMpcCustodian(
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

  async function joinMpcWallet(
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

  async function getMpcCustodians(keyringId: string): Promise<Custodian[]> {
    return await keyringController.withKeyring(
      { id: keyringId },
      async ({ keyring }) => {
        return (keyring as MPCKeyring).getCustodians();
      },
    );
  }

  async function getMpcCustodianId(keyringId: string): Promise<string> {
    return await keyringController.withKeyring(
      { id: keyringId },
      async ({ keyring }) => {
        return (keyring as MPCKeyring).getCustodianId();
      },
    );
  }

  return {
    createMpcKeyring,
    createMpcJoinData,
    addMpcCustodian,
    joinMpcWallet,
    getMpcCustodians,
    getMpcCustodianId,
  };
}
