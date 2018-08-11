const extension = require('extensionizer')
const {EventEmitter} = require('events')
const HDKey = require('hdkey')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Transaction = require('ethereumjs-tx')


// HD path differs from eth-hd-keyring - MEW, Parity, Geth and Official Ledger clients use same unusual derivation for Ledger
const hdPathString = `44'/60'/0'`
const type = 'Ledger Hardware'
const ORIGIN  = 'https://localhost:3000'
const pathBase = 'm'
const MAX_INDEX = 1000

class LedgerKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = type
    this.page = 0
    this.perPage = 5
    this.unlockedAccount = 0
    this.hdk = new HDKey()
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

    console.log('[LEDGER]: LEDGER FROM-IFRAME LISTENER READY')
    
  }

  sendMessage(msg, cb) {
    console.log('[LEDGER]: SENDING MESSAGE TO IFRAME', msg)
    this.iframe.contentWindow.postMessage({...msg, target: 'LEDGER-IFRAME'}, '*')
    window.addEventListener('message', ({ origin, data }) => {
      if(origin !== ORIGIN) return false
      if (data && data.action && data.action === `${msg.action}-reply`) {
        console.log('[LEDGER]: GOT MESAGE FROM IFRAME', data)
        cb(data)
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
          this.hdk.publicKey = new Buffer(payload.publicKey, 'hex')
          this.hdk.chainCode = new Buffer(payload.chainCode, 'hex')
          resolve('just unlocked')
        } else {
          reject(payload.error || 'Unknown error')
        }
      })
    })
  }

  setAccountToUnlock (index) {
    this.unlockedAccount = parseInt(index, 10)
  }

  addAccounts (n = 1) {

    return new Promise((resolve, reject) => {
      this.unlock()
        .then(_ => {
          const from = this.unlockedAccount
          const to = from + n
          this.accounts = []

          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
            this.accounts.push(address)
            this.page = 0
          }
          resolve(this.accounts)
        })
        .catch(e => {
          reject(e)
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

          const from = (this.page - 1) * this.perPage
          const to = from + this.perPage

          const accounts = []

          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
             accounts.push({
              address: address,
              balance: null,
              index: i,
            })
            this.paths[ethUtil.toChecksumAddress(address)] = i

          }
          resolve(accounts)
        })
        .catch(e => {
          reject(e)
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
              tx: {
                to: this._normalize(tx.to),
                value: this._normalize(tx.value),
                data: this._normalize(tx.data),
                chainId: tx._chainId,
                nonce: this._fixNonce(this._normalize(tx.nonce)),
                gasLimit: this._normalize(tx.gasLimit),
                gasPrice: this._normalize(tx.gasPrice),
              },
              path: this._pathFromAddress(address)
            },
          },
          ({action, success, payload}) => {
            if (success) {
              console.log('[LEDGER]: got tx signed!', payload.txData)
              const signedTx = new Transaction(payload.txData)
              // Validate that the signature matches the right address
              const addressSignedWith = ethUtil.toChecksumAddress(`0x${signedTx.from.toString('hex')}`)
              const correctAddress = ethUtil.toChecksumAddress(address)
              if (addressSignedWith !== correctAddress) {
                reject('signature doesnt match the right address')
              }
              console.log('[LEDGER]: all good!', signedTx.toJSON())
              console.log('[LEDGER]: signedTX', `0x${signedTx.serialize().toString('hex')}`)
              
              resolve(signedTx)
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

  /* PRIVATE METHODS */

  _padLeftEven (hex) {
    return hex.length % 2 !== 0 ? `0${hex}` : hex
  }

  _normalize (buf) {
    return this._padLeftEven(ethUtil.bufferToHex(buf).toLowerCase())
  }

  _addressFromIndex (pathBase, i) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`)
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex')
    return ethUtil.toChecksumAddress(address)
  }

  _pathFromAddress (address) {
    const checksummedAddress = ethUtil.toChecksumAddress(address)
    let index = this.paths[checksummedAddress]
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this._addressFromIndex(pathBase, i)) {
          index = i
          break
        }
      }
    }

    if (typeof index === 'undefined') {
      throw new Error('Unknown address')
    }
    return `${this.hdPath}/${index}`
  }

  _toAscii (hex) {
      let str = ''
      let i = 0; const l = hex.length
      if (hex.substring(0, 2) === '0x') {
          i = 2
      }
      for (; i < l; i += 2) {
          const code = parseInt(hex.substr(i, 2), 16)
          str += String.fromCharCode(code)
      }

      return str
  }

  _fixNonce(nonce){
    if(nonce === '0x'){
      return `${nonce}0`
    }
    return nonce
  }
}

LedgerKeyring.type = type
module.exports = LedgerKeyring
