import { KeyringController } from 'eth-keyring-controller';
import log from 'loglevel';

import { KEYRING_TYPES } from '../../../shared/constants/keyrings';

const seedPhraseVerifier = {
  /**
   * Verifies if the seed words can restore the accounts.
   *
   * Key notes:
   * - The seed words can recreate the primary keyring and the accounts belonging to it.
   * - The created accounts in the primary keyring are always the same.
   * - The keyring always creates the accounts in the same sequence.
   *
   * @param {Array} createdAccounts - The accounts to restore
   * @param {Buffer} seedPhrase - The seed words to verify, encoded as a Buffer
   * @returns {Promise<void>}
   */
  async verifyAccounts(createdAccounts, seedPhrase) {
    if (!createdAccounts || createdAccounts.length < 1) {
      throw new Error('No created accounts defined.');
    }

    const keyringController = new KeyringController({});
    const keyringBuilder = keyringController.getKeyringBuilderForType(
      KEYRING_TYPES.HD_KEY_TREE,
    );
    const keyring = keyringBuilder();
    const opts = {
      mnemonic: seedPhrase,
      numberOfAccounts: createdAccounts.length,
    };

    await keyring.deserialize(opts);
    const restoredAccounts = await keyring.getAccounts();
    log.debug(`Created accounts: ${JSON.stringify(createdAccounts)}`);
    log.debug(`Restored accounts: ${JSON.stringify(restoredAccounts)}`);

    if (restoredAccounts.length !== createdAccounts.length) {
      // this should not happen...
      throw new Error('Wrong number of accounts');
    }

    for (let i = 0; i < restoredAccounts.length; i++) {
      if (
        restoredAccounts[i].toLowerCase() !== createdAccounts[i].toLowerCase()
      ) {
        throw new Error(
          `Not identical accounts! Original: ${createdAccounts[i]}, Restored: ${restoredAccounts[i]}`,
        );
      }
    }
  },
};

export default seedPhraseVerifier;
