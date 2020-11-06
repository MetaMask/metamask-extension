import log from 'loglevel'
import Wallet from 'ethereumjs-wallet'
import importers from 'ethereumjs-wallet/thirdparty'
import ethUtil from 'ethereumjs-util'

const accountImporter = {
  importAccount(strategy, args) {
    try {
      const importer = this.strategies[strategy]
      const privateKeyHex = importer(...args)
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

      const prefixed = ethUtil.addHexPrefix(privateKey)
      const buffer = ethUtil.toBuffer(prefixed)

      if (!ethUtil.isValidPrivate(buffer)) {
        throw new Error('Cannot import invalid private key.')
      }

      const stripped = ethUtil.stripHexPrefix(prefixed)
      return stripped
    },
    'JSON File': (input, password) => {
      let wallet
      try {
        wallet = importers.fromEtherWallet(input, password)
      } catch (e) {
        log.debug('Attempt to import as EtherWallet format failed, trying V3')
        wallet = Wallet.fromV3(input, password, true)
      }

      return walletToPrivateKey(wallet)
    },
  },
}

function walletToPrivateKey(wallet) {
  const privateKeyBuffer = wallet.getPrivateKey()
  return ethUtil.bufferToHex(privateKeyBuffer)
}

export default accountImporter
