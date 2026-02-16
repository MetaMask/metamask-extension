import { KeyringController, KeyringTypes } from '@metamask/keyring-controller';
import { MPCKeyring } from '@metamask/eth-mpc-keyring';
import type { Custodian } from '@metamask/eth-mpc-keyring';
import { cacheVerifierToken } from './mpc-verifier-token-cache';

export type { Custodian } from '@metamask/eth-mpc-keyring';

/**
 * Build the MPC wallet API bound to a KeyringController instance.
 * The returned object can be spread directly into the background API.
 *
 * @param keyringController - The keyring controller instance.
 * @returns An object with all MPC wallet API methods.
 */
export function getMpcApi(keyringController: KeyringController) {
  /**
   * Store a passkey assertion so that the next `getVerifierToken` call from
   * the MPC keyring can return it. Must be called from the UI *before*
   * triggering any MPC operation that requires verifier authentication.
   *
   * @param verifierId - The verifier identifier (passkey public key).
   * @param token - Serialised passkey assertion JSON.
   */
  async function setMpcVerifierToken(
    verifierId: string,
    token: string,
  ): Promise<void> {
    cacheVerifierToken(verifierId, token);
  }

  async function createMpcKeyring(verifierId: string, verifierToken: string) {
    // Cache the passkey assertion *before* setup so getVerifierToken can read it
    cacheVerifierToken(verifierId, verifierToken);

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
    verifierToken: string,
  ): Promise<string> {
    // Cache the passkey assertion *before* setup so getVerifierToken can read it
    cacheVerifierToken(verifierId, verifierToken);

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
    setMpcVerifierToken,
    createMpcKeyring,
    createMpcJoinData,
    addMpcCustodian,
    joinMpcWallet,
    getMpcCustodians,
    getMpcCustodianId,
  };
}
