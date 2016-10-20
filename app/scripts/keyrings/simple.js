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
    const walletData = this.opts.wallets || []
    this.wallets = walletData.map((w) => {
      return Wallet.fromPrivateKey(w)
    })
  }

  serialize() {
    return {
      type,
      wallets: this.wallets.map(w => w.getPrivateKey()),
    }
  }

  addAccounts(n = 1) {
    var newWallets = []
    for (var i = 0; i < n; i++) {
      newWallets.push(Wallet.generate())
    }
    this.wallets.concat(newWallets)
    return newWallets.map(w => w.getAddress())
  }

  getAccounts() {
    return this.wallets.map(w => w.getAddress())
  }

}
