const EventEmitter = require('events').EventEmitter
const Wallet = require('ethereumjs-wallet')
const type = 'Simple Key Pair'

module.exports = class SimpleKeyring extends EventEmitter {

  static type() {
    return type
  }

  constructor(opts) {
    super()
    this.type = type
    this.opts = opts || {}
    this.wallets = []
  }

  serialize() {
    return this.wallets.map(w => w.getPrivateKey().toString('hex'))
  }

  deserialize(wallets = []) {
    this.wallets = wallets.map((w) => {
      var b = new Buffer(w, 'hex')
      const wallet = Wallet.fromPrivateKey(b)
      return wallet
    })
  }

  addAccounts(n = 1) {
    var newWallets = []
    for (var i = 0; i < n; i++) {
      newWallets.push(Wallet.generate())
    }
    this.wallets = this.wallets.concat(newWallets)
    return newWallets.map(w => w.getAddress().toString('hex'))
  }

  getAccounts() {
    return this.wallets.map(w => w.getAddress().toString('hex'))
  }

}
