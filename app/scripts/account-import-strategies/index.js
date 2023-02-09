import { bufferToHex, isValidPrivate, toBuffer } from 'ethereumjs-util';
import Wallet from 'ethereumjs-wallet';
import importers from 'ethereumjs-wallet/thirdparty';
import { ethers } from 'ethers';
import log from 'loglevel';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';
import { addHexPrefix } from '../lib/util';

const accountImporter = {
  async importAccount(strategy, args) {
    const importer = this.strategies[strategy];
    const privateKeyHex = importer(...args);
    return privateKeyHex;
  },

  strategies: {
    'Private Key': (privateKey) => {
      if (!privateKey) {
        throw new Error('Cannot import an empty key.'); // It should never get here, because this should be stopped in the UI
      }

      // Check if the user has entered an SRP by mistake instead of a private key
      if (ethers.utils.isValidMnemonic(privateKey.trim())){
        throw new Error('t(importAccountErrorIsSRP)');
      }

      privateKey = privateKey.replace(/\s+/g, ''); // Remove all whitespace

      const prefixed = addHexPrefix(privateKey);
      let buffer;
      try {
        buffer = toBuffer(prefixed);
      } catch (e) {
        throw new Error('t(importAccountErrorNotHexadecimal)');
      }

      try {
        if (!isValidPrivate(buffer)) {
          throw new Error('t(importAccountErrorNotAValidPrivateKey)');
        }
      } catch (e) {
        throw new Error('t(importAccountErrorNotAValidPrivateKey)');
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
