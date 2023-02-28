/* eslint-disable import/newline-after-import */
/* eslint-disable import/first */

let KeyringController;

///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
import { KeyringController as MetaMaskKeyringController } from '@metamask/eth-keyring-controller';
KeyringController = MetaMaskKeyringController;
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(mmi)
import CodefiKeyringController from '@codefi/eth-keyring-controller';
KeyringController = CodefiKeyringController;
///: END:ONLY_INCLUDE_IN

import log from 'loglevel';

import { KeyringType } from '../../../shared/constants/keyring';

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
      KeyringType.hdKeyTree,
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
