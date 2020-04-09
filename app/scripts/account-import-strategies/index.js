import log from 'loglevel'
import { Wallet } from 'cfx-wallet'
import {
  toBuffer,
  addHexPrefix,
  bufferToHex,
  isValidPrivate,
  stripHexPrefix,
} from 'cfx-util'

const accountImporter = {
  importAccount (strategy, args) {
    try {
      const importer = this.strategies[strategy]
      const privateKeyHex = importer.apply(null, args)
      return Promise.resolve(privateKeyHex)
    } catch (e) {
      return Promise.reject(e)
    }
  },

  strategies: {
    'Private Key': (privateKey) => {
      if (!privateKey) {
        throw new Error('Cannot import an empty key.')
      }

      const prefixed = addHexPrefix(privateKey)
      const buffer = toBuffer(prefixed)

      if (!isValidPrivate(buffer)) {
        throw new Error('Cannot import invalid private key.')
      }

      const stripped = stripHexPrefix(prefixed)
      return stripped
    },
    'JSON File': (input, password) => {
      let wallet
      try {
        wallet = Wallet.fromV3(input, password)
      } catch (e) {
        log.debug('Attempt to import as EtherWallet format failed, trying V3')
        wallet = Wallet.fromV3(input, password, true)
      }

      return walletToPrivateKey(wallet)
    },
  },
}

function walletToPrivateKey (wallet) {
  const privateKeyBuffer = wallet.getPrivateKey()
  return bufferToHex(privateKeyBuffer)
}

export default accountImporter
