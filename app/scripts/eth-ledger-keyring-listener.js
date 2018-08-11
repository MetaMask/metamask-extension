  const extension = require('extensionizer')
const {EventEmitter} = require('events')


// HD path differs from eth-hd-keyring - MEW, Parity, Geth and Official Ledger clients use same unusual derivation for Ledger
const hdPathString = `m/44'/60'/0'`
const type = 'Ledger Hardware Keyring'

class LedgerKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = type
    this.deserialize(opts)
  }

  serialize () {
    return Promise.resolve({hdPath: this.hdPath, accounts: this.accounts})
  }

  deserialize (opts = {}) {
    this.hdPath = opts.hdPath || hdPathString
    this.accounts = opts.accounts || []
    return Promise.resolve()
  }

  async addAccounts (n = 1) {
    return new Promise((resolve, reject) => {
      extension.runtime.sendMessage({
        action: 'ledger-add-account',
        n,
      })

      extension.runtime.onMessage.addListener(({action, success, payload}) => {
        if (action === 'ledger-sign-transaction') {
          if (success) {
            resolve(payload)
          } else {
            reject(payload)
          }
        }
      })
    })
  }

  async getAccounts () {
    return this.accounts.slice()
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction (address, tx) {
    return new Promise((resolve, reject) => {
      extension.runtime.sendMessage({
        action: 'ledger-sign-transaction',
        address,
        tx,
      })

      extension.runtime.onMessage.addListener(({action, success, payload}) => {
        if (action === 'ledger-sign-transaction') {
          if (success) {
            resolve(payload)
          } else {
            reject(payload)
          }
        }
      })
    })
  }

  async signMessage (withAccount, data) {
    throw new Error('Not supported on this device')
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage (withAccount, message) {
    return new Promise((resolve, reject) => {
      extension.runtime.sendMessage({
        action: 'ledger-sign-personal-message',
        withAccount,
        message,
      })

      extension.runtime.onMessage.addListener(({action, success, payload}) => {
        if (action === 'ledger-sign-personal-message') {
          if (success) {
            resolve(payload)
          } else {
            reject(payload)
          }
        }
      })
    })
  }

  async signTypedData (withAccount, typedData) {
    throw new Error('Not supported on this device')
  }

  async exportAccount (address) {
    throw new Error('Not supported on this device')
  }
}

LedgerKeyring.type = type
module.exports = LedgerKeyring
