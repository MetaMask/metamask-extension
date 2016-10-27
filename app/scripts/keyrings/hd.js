const EventEmitter = require('events').EventEmitter
const hdkey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')
const ethUtil = require('ethereumjs-util')
const type = 'HD Key Tree'
const sigUtil = require('../lib/sig-util')

module.exports = class SimpleKeyring extends EventEmitter {

  static type() {
    return type
  }

  constructor(opts) {
    super()
    this.type = type
    this.opts = opts || {}
    this.wallets = []
    this.mnemonic = null
  }

  deserialize({ mnemonic, n }) {
    this.initFromMnemonic(mnemonic || bip39.generateMnemonic())
    this.addAccounts(n)
  }

  initFromMnemonic(mnemonic) {
    const seed = bip39.mnemonicToSeed(mnemonic)
    this.mnemonic = mnemonic
    this.hdWallet = hdkey.fromMasterSeed(seed)
    this.seed = bip39.mnemonicToSeedHex(seed)
  }

  serialize() {
    return {
      mnemonic: this.mnemonic,
      n: this.wallets.length,
    }
  }

  addAccounts(n = 1) {
    const newWallets = []
    for (let i = 0; i < n; i++) {
      const wallet = this.hdWallet.getWallet()
      newWallets.push(wallet)
      this.wallets.push(wallet)
    }
    return newWallets.map(w => w.getAddress().toString('hex'))
  }

  getAccounts() {
    return this.wallets.map(w => w.getAddress().toString('hex'))
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction(address, tx) {
    const wallet = this.getWalletForAccount(address)
    var privKey = wallet.getPrivateKey()
    tx.sign(privKey)
    return tx
  }

  // For eth_sign, we need to sign transactions:
  signMessage(withAccount, data) {
    const wallet = this.getWalletForAccount(withAccount)
    const message = ethUtil.removeHexPrefix(data)
    var privKey = wallet.getPrivateKey()
    var msgSig = ethUtil.ecsign(new Buffer(message, 'hex'), privKey)
    var rawMsgSig = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
    return rawMsgSig
  }

  getWalletForAccount(account) {
    return this.wallets.find(w => w.getAddress().toString('hex') === account)
  }

}

