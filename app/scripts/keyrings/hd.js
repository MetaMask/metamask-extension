const EventEmitter = require('events').EventEmitter
const hdkey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')
const ethUtil = require('ethereumjs-util')
const type = 'HD Key Tree'
const sigUtil = require('../lib/sig-util')

const hdPathString = `m/44'/60'/0'/0`

module.exports = class HdKeyring extends EventEmitter {

  static type() {
    return type
  }

  constructor(opts = {}) {
    super()
    this.type = type
    this.deserialize(opts)
  }

  deserialize(opts = {}) {
    this.opts = opts || {}
    this.wallets = []
    this.mnemonic = null
    this.root = null

    if ('mnemonic' in opts) {
      this.initFromMnemonic(opts.mnemonic)
    }

    if ('n' in opts) {
      this.addAccounts(opts.n)
    }
  }

  initFromMnemonic(mnemonic) {
    this.mnemonic = mnemonic
    const seed = bip39.mnemonicToSeed(mnemonic)
    this.hdWallet = hdkey.fromMasterSeed(seed)
    this.root = this.hdWallet.derivePath(hdPathString)
  }

  serialize() {
    return {
      mnemonic: this.mnemonic,
      n: this.wallets.length,
    }
  }

  exportAccount(address) {
    const wallet = this.getWalletForAccount(address)
    return wallet.getPrivateKey().toString('hex')
  }

  addAccounts(n = 1) {
    if (!this.root) {
      this.initFromMnemonic(bip39.generateMnemonic())
    }

    const oldLen = this.wallets.length
    const newWallets = []
    for (let i = oldLen; i < n + oldLen; i++) {
      const child = this.root.deriveChild(i)
      const wallet = child.getWallet()
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
    return this.wallets.find((w) => {
      const address = w.getAddress().toString('hex')
      return ((address === account) || (normalize(address) === account))
    })
  }



}

function normalize(address) {
  return ethUtil.addHexPrefix(address.toLowerCase())
}
