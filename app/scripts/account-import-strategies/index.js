import { isValidMnemonic } from '@ethersproject/hdnode';
import { bufferToHex, isValidPrivate, toBuffer } from 'ethereumjs-util';
import Wallet from 'ethereumjs-wallet';
import importers from 'ethereumjs-wallet/thirdparty';
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
      if (isValidMnemonic(privateKey.trim())) {
        throw new Error(`t('importAccountErrorIsSRP')`);
      }

      const trimmedPrivateKey = privateKey.replace(/\s+/gu, ''); // Remove all whitespace

      const prefixedPrivateKey = addHexPrefix(trimmedPrivateKey);
      let buffer;
      try {
        buffer = toBuffer(prefixedPrivateKey);
      } catch (e) {
        throw new Error(`t('importAccountErrorNotHexadecimal')`);
      }

      try {
        if (!isValidPrivate(buffer)) {
          throw new Error(`t('importAccountErrorNotAValidPrivateKey')`);
        }
      } catch (e) {
        throw new Error(`t('importAccountErrorNotAValidPrivateKey')`);
      }

      const strippedPrivateKey = stripHexPrefix(prefixedPrivateKey);
      return strippedPrivateKey;
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
