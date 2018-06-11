const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
// const sigUtil = require('eth-sig-util')

const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'Trezor Hardware'
const Transaction = require('ethereumjs-tx')
const pathBase = 'm'
const TrezorConnect = require('./trezor-connect.js')
const HDKey = require('hdkey')
const TREZOR_MIN_FIRMWARE_VERSION = '1.5.2'
const log = require('loglevel')

class TrezorKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = keyringType
    this.accounts = []
    this.hdk = new HDKey()
    this.deserialize(opts)
    this.page = 0
    this.perPage = 5
    this.unlockedAccount = 0
  }

  serialize () {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      page: this.page,
    })
  }

  deserialize (opts = {}) {
    this.hdPath = opts.hdPath || hdPathString
    this.accounts = opts.accounts || []
    this.page = opts.page || 0
    return Promise.resolve()
  }

  unlock () {

    if (this.hdk.publicKey) return Promise.resolve()

    return new Promise((resolve, reject) => {
      TrezorConnect.getXPubKey(
        this.hdPath,
        response => {
          if (response.success) {
            this.hdk.publicKey = new Buffer(response.publicKey, 'hex')
            this.hdk.chainCode = new Buffer(response.chainCode, 'hex')
            resolve()
          } else {
            reject(response.error || 'Unknown error')
          }
        },
        TREZOR_MIN_FIRMWARE_VERSION
      )
    })
  }

  setAccountToUnlock (index) {
    this.unlockedAccount = parseInt(index, 10)
  }

  addAccounts (n = 1) {

    return new Promise((resolve, reject) => {
      return this.unlock()
        .then(_ => {
          const from = this.unlockedAccount
          const to = from + 1
          this.accounts = []

          for (let i = from; i < to; i++) {

            this.accounts.push(this._addressFromId(pathBase, i))
            this.page = 0
          }
          resolve(this.accounts)
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  getPage () {

    return new Promise((resolve, reject) => {
      return this.unlock()
        .then(_ => {

          const from = this.page === 0 ? 0 : (this.page - 1) * this.perPage
          const to = from + this.perPage

          const accounts = []

          for (let i = from; i < to; i++) {

            accounts.push({
              address: this._addressFromId(pathBase, i),
              balance: 0,
              index: i,
            })
          }
          log.debug(accounts)
          resolve(accounts)
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  async getPrevAccountSet () {
    this.page--
    return await this.getPage()
  }

  async getNextAccountSet () {
    this.page++
    return await this.getPage()
  }

  getAccounts () {
    return Promise.resolve(this.accounts.slice())
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction (address, tx) {

      return new Promise((resolve, reject) => {
        log.debug('sign transaction ', address, tx)
        const account = `m/44'/60'/0'/${this.unlockedAccount}`

        const txData = {
          account,
          nonce: this._cleanData(tx.nonce),
          gasPrice: this._cleanData(tx.gasPrice),
          gasLimit: this._cleanData(tx.gasLimit),
          to: this._cleanData(tx.to),
          value: this._cleanData(tx.value),
          data: this._cleanData(tx.data),
          chainId: tx._chainId,
        }

        TrezorConnect.ethereumSignTx(
          txData.account,
          txData.nonce,
          txData.gasPrice,
          txData.gasLimit,
          txData.to,
          txData.value,
          txData.data === '' ? null : txData.data,
          txData.chainId,
          response => {
            if (response.success) {
              tx.v = `0x${response.v.toString(16)}`
              tx.r = `0x${response.r}`
              tx.s = `0x${response.s}`
              log.debug('about to create new tx with data', tx)

              const signedTx = new Transaction(tx)

              log.debug('signature is valid?', signedTx.verifySignature())

              const addressSignedWith = ethUtil.toChecksumAddress(`0x${signedTx.from.toString('hex')}`)
              const correctAddress = ethUtil.toChecksumAddress(address)
              if (addressSignedWith !== correctAddress) {
                // throw new Error('signature doesnt match the right address')
                log.error('signature doesnt match the right address', addressSignedWith, correctAddress)
              }

              resolve(signedTx)

            } else {
                throw new Error(response.error || 'Unknown error')
            }
          },
          TREZOR_MIN_FIRMWARE_VERSION)
     })
  }

  async signMessage (withAccount, data) {
    throw new Error('Not supported on this device')
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage (withAccount, message) {
    // Waiting on trezor to enable this
    throw new Error('Not supported on this device')
  }

  async signTypedData (withAccount, typedData) {
    // Waiting on trezor to enable this
    throw new Error('Not supported on this device')
  }

  async exportAccount (address) {
    throw new Error('Not supported on this device')
  }

  _padLeftEven (hex) {
    return hex.length % 2 !== 0 ? `0${hex}` : hex
  }

  _cleanData (buf) {
    return this._padLeftEven(ethUtil.bufferToHex(buf).substring(2).toLowerCase())
  }

  _addressFromId(pathBase, i) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`)
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex')
    return ethUtil.toChecksumAddress(address)
  }
}

TrezorKeyring.type = keyringType
module.exports = TrezorKeyring
