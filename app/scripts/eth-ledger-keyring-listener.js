const extension = require('extensionizer')
const {EventEmitter} = require('events')


// HD path differs from eth-hd-keyring - MEW, Parity, Geth and Official Ledger clients use same unusual derivation for Ledger
const hdPathString = `m/44'/60'/0'`
const type = 'Ledger Hardware Keyring'
const ORIGIN  = 'http://localhost:9000'

class LedgerKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = type
    this.page = 0
    this.perPage = 5
    this.unlockedAccount = 0
    this.paths = {}
    this.iframe = null
    this.setupIframe()
    this.deserialize(opts)
  }

  setupIframe(){
    this.iframe = document.createElement('iframe')
    this.iframe.src = ORIGIN
    console.log('Injecting ledger iframe')
    document.head.appendChild(this.iframe)

    
     /*
    Passing messages from iframe to background script
    */
    console.log('[LEDGER]: LEDGER FROM-IFRAME LISTENER READY')
    
  }

  sendMessage(msg, cb) {
    console.log('[LEDGER]: SENDING MESSAGE TO IFRAME', msg)
    this.iframe.contentWindow.postMessage({...msg, target: 'LEDGER-IFRAME'}, '*')
    window.addEventListener('message', event => {
      if(event.origin !== ORIGIN) return false
      if (event.data && event.data.action && event.data.action.search(name) !== -1) {
        console.log('[LEDGER]: GOT MESAGE FROM IFRAME', event.data)
        cb(event.data)
      }
    })
  }

  serialize () {
    return Promise.resolve({hdPath: this.hdPath, accounts: this.accounts})
  }

  deserialize (opts = {}) {
    this.hdPath = opts.hdPath || hdPathString
    this.unlocked = opts.unlocked || false
    this.accounts = opts.accounts || []
    return Promise.resolve()
  }

  isUnlocked () {
    return this.unlocked
  }

  setAccountToUnlock (index) {
    this.unlockedAccount = parseInt(index, 10)
  }

  unlock () {

    if (this.isUnlocked()) return Promise.resolve('already unlocked')

    return new Promise((resolve, reject) => {
      this.sendMessage({
        action: 'ledger-unlock',
        params: {
          hdPath: this.hdPath,
        },
      },
      ({action, success, payload}) => {  
        if (success) {
          resolve(payload)
        } else {
          reject(payload)
        }
      })
    })
  }

  async addAccounts (n = 1) {
    return new Promise((resolve, reject) => {
      this.unlock()
      .then(_ => {
        this.sendMessage({
          action: 'ledger-add-account',
          params: {
            n,
          },
        },
        ({action, success, payload}) => {
          if (success) {
            resolve(payload)
          } else {
            reject(payload)
          }        
        })
      })
    })
  }

  getFirstPage () {
    this.page = 0
    return this.__getPage(1)
  }

  getNextPage () {
    return this.__getPage(1)
  }

  getPreviousPage () {
    return this.__getPage(-1)
  }

  __getPage (increment) {

    this.page += increment

    if (this.page <= 0) { this.page = 1 }

    return new Promise((resolve, reject) => {
      this.unlock()
        .then(_ => {
          this.sendMessage({
            action: 'ledger-get-page',
            params: {
              page: this.page,
            },
          },
          ({action, success, payload}) => {
            if (success) {
              resolve(payload)
            } else {
              reject(payload)
            }        
          })
      })
    })
  }

  getAccounts () {
    return Promise.resolve(this.accounts.slice())
  }

  removeAccount (address) {
    if (!this.accounts.map(a => a.toLowerCase()).includes(address.toLowerCase())) {
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.accounts = this.accounts.filter(a => a.toLowerCase() !== address.toLowerCase())
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction (address, tx) {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then(_ => {
          console.log('[LEDGER]: sending message ', 'ledger-sign-transaction')
          this.sendMessage({
            action: 'ledger-sign-transaction',
            params: {
              address,
              tx,
            },
          },
          ({action, success, payload}) => {
            if (success) {
              resolve(payload)
            } else {
              reject(payload)
            }        
          })
      })
    })
  }

  async signMessage (withAccount, data) {
    throw new Error('Not supported on this device')
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage (withAccount, message) {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then(_ => {
          console.log('[LEDGER]: sending message ', 'ledger-sign-personal-message')
          this.sendMessage({
            action: 'ledger-sign-personal-message',
            params: {
              withAccount,
              message,
            },
          },
          ({action, success, payload}) => {
            if (success) {
              resolve(payload)
            } else {
              reject(payload)
            }        
          })
      })
    })
  }

  async signTypedData (withAccount, typedData) {
    throw new Error('Not supported on this device')
  }

  async exportAccount (address) {
    throw new Error('Not supported on this device')
  }

  forgetDevice () {
    this.accounts = []
    this.unlocked = false
    this.page = 0
    this.unlockedAccount = 0
    this.paths = {}
  }
}

LedgerKeyring.type = type
module.exports = LedgerKeyring
