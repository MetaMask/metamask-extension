const Wallet = require('ethereumjs-wallet')
const importers = require('ethereumjs-wallet/thirdparty')
const ethUtil = require('ethereumjs-util')

const accountImporter = {

  importAccount(strategy, args) {
    try {
      const importer = this.strategies[strategy]
      const wallet = importer.apply(null, args)
      const privateKeyHex = walletToPrivateKey(wallet)
      return Promise.resolve(privateKeyHex)
    } catch (e) {
      return Promise.reject(e)
    }
  },

  strategies: {
    'Private Key': (privateKey) => {
      const stripped = ethUtil.stripHexPrefix(privateKey)
      const buffer = new Buffer(stripped, 'hex')
      return Wallet.fromPrivateKey(buffer)
    },
    'JSON File': (input, password) => {
      const wallet = importers.fromEtherWallet(input, password)
      return walletToPrivateKey(wallet)
    },
  },

}

function walletToPrivateKey (wallet) {
  const privateKeyBuffer = wallet.getPrivateKey()
  return ethUtil.bufferToHex(privateKeyBuffer)
}

module.exports = accountImporter
