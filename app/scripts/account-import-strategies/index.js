const Wallet = require('ethereumjs-wallet')
const importers = require('ethereumjs-wallet/thirdparty')
const ethUtil = require('ethereumjs-util')

const accountImporter = {

  importAccount(strategy, args) {
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
      const stripped = ethUtil.stripHexPrefix(privateKey)
      return stripped
    },
    'JSON File': (input, password) => {
      let wallet
      try {
        wallet = importers.fromEtherWallet(input, password)
      } catch (e) {
        console.log('Attempt to import as EtherWallet format failed, trying V3...')
      }

      if (!wallet) {
        wallet = Wallet.fromV3(input, password, true)
      }

      return walletToPrivateKey(wallet)
    },
  },

}

function walletToPrivateKey (wallet) {
  const privateKeyBuffer = wallet.getPrivateKey()
  return ethUtil.bufferToHex(privateKeyBuffer)
}

module.exports = accountImporter
