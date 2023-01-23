import log from 'loglevel';
import Wallet from 'ethereumjs-wallet';
import importers from 'ethereumjs-wallet/thirdparty';
import { toBuffer, isValidPrivate, bufferToHex } from 'ethereumjs-util';
import { addHexPrefix } from '../lib/util';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';

const accountImporter = {
  async importAccount(strategy, args) {
    const importer = this.strategies[strategy];
    const privateKeyHex = importer(...args);
    return privateKeyHex;
  },

  strategies: {
    'Private Key': (privateKey) => {
      if (!privateKey) {
        throw new Error('Cannot import an empty key.');
      }

      const prefixed = addHexPrefix(privateKey);
      const buffer = toBuffer(prefixed);

      if (!isValidPrivate(buffer)) {
        throw new Error('Cannot import invalid private key.');
      }

      const stripped = stripHexPrefix(prefixed);
      return stripped;
    },
    'JSON File': (input, password) => {
      let wallet;
      try {
        wallet = importers.fromEtherWallet(input, password);
      } catch (e) {
        log.debug('Attempt to import as EtherWallet format failed, trying V3');
        wallet = Wallet.fromV3(input, password, true);
      }

      return walletToPrivateKey(wallet);
    },
  },
};

function walletToPrivateKey(wallet) {
  const privateKeyBuffer = wallet.getPrivateKey();
  return bufferToHex(privateKeyBuffer);
}

export default accountImporter;
