const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
// const sigUtil = require('eth-sig-util')

const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'Trezor Hardware'

const TrezorConnect = require('./trezor-connect.js')
const HDKey = require('hdkey')
const TREZOR_FIRMWARE_VERSION = '1.4.0'
//const log = require('loglevel')

class TrezorKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = keyringType
    this.accounts = []
    this.hdk = new HDKey()
    this.deserialize(opts)
    this.page = 0
    this.perPage = 5
    this.accountToUnlock = 0
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
        TREZOR_FIRMWARE_VERSION
      )
    })
  }

  setAccountToUnlock (index) {
    this.accountToUnlock = parseInt(index, 10)
  }

  addAccounts (n = 1) {

    return new Promise((resolve, reject) => {
      return this.unlock()
        .then(_ => {
          const pathBase = 'm'
          const from = this.accountToUnlock
          const to = from + 1

          this.accounts = []

          for (let i = from; i < to; i++) {
            const dkey = this.hdk.derive(`${pathBase}/${i}`)
            const address = ethUtil
              .publicToAddress(dkey.publicKey, true)
              .toString('hex')
            this.accounts.push(ethUtil.toChecksumAddress(address))
            this.page = 0
          }
          resolve(this.accounts)
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  async getPage () {

    return new Promise((resolve, reject) => {
      return this.unlock()
        .then(_ => {
          const pathBase = 'm'
          const from = this.page === 0 ? 0 : (this.page - 1) * this.perPage
          const to = from + this.perPage

          const accounts = []

          for (let i = from; i < to; i++) {
            const dkey = this.hdk.derive(`${pathBase}/${i}`)
            const address = ethUtil
              .publicToAddress(dkey.publicKey, true)
              .toString('hex')
            accounts.push({
              address: ethUtil.toChecksumAddress(address),
              balance: 0,
              index: i,
            })
          }
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
    throw new Error('Not supported on this device')
    /*
    await this.lock.acquire()
    try {

      // Look before we leap
      await this._checkCorrectTrezorAttached()

      let accountId = await this._findAddressId(address)
      let eth = await this._getEth()
      tx.v = tx._chainId
      let TrezorSig = await eth.signTransaction(
        this._derivePath(accountId),
        tx.serialize().toString('hex')
      )
      tx.v = parseInt(TrezorSig.v, 16)
      tx.r = '0x' + TrezorSig.r
      tx.s = '0x' + TrezorSig.s

      // Since look before we leap check is racy, also check that signature is for account expected
      let addressSignedWith = ethUtil.bufferToHex(tx.getSenderAddress())
      if (addressSignedWith.toLowerCase() !== address.toLowerCase()) {
        throw new Error(
          `Signature is for ${addressSignedWith} but expected ${address} - is the correct Trezor device attached?`
        )
      }

      return tx

    } finally {
      await this.lock.release()
    }*/
  }

  async signMessage (withAccount, data) {
    throw new Error('Not supported on this device')
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage (withAccount, message) {
    throw new Error('Not supported on this device')
    /*
    await this.lock.acquire()
    try {
      // Look before we leap
      await this._checkCorrectTrezorAttached()

      let accountId = await this._findAddressId(withAccount)
      let eth = await this._getEth()
      let msgHex = ethUtil.stripHexPrefix(message)
      let TrezorSig = await eth.signPersonalMessage(
        this._derivePath(accountId),
        msgHex
      )
      let signature = this._personalToRawSig(TrezorSig)

      // Since look before we leap check is racy, also check that signature is for account expected
      let addressSignedWith = sigUtil.recoverPersonalSignature({
        data: message,
        sig: signature,
      })
      if (addressSignedWith.toLowerCase() !== withAccount.toLowerCase()) {
        throw new Error(
          `Signature is for ${addressSignedWith} but expected ${withAccount} - is the correct Trezor device attached?`
        )
      }

      return signature

    } finally {
      await this.lock.release()
    } */
  }

  async signTypedData (withAccount, typedData) {
    throw new Error('Not supported on this device')
  }

  async exportAccount (address) {
    throw new Error('Not supported on this device')
  }

  async _findAddressId (addr) {
    const result = this.accounts.indexOf(addr)
    if (result === -1) throw new Error('Unknown address')
    else return result
  }

  async _addressFromId (i) {
    /* Must be called with lock acquired
    const eth = await this._getEth()
    return (await eth.getAddress(this._derivePath(i))).address*/
    const result = this.accounts[i]
    if (!result) throw new Error('Unknown address')
    else return result
  }

  async _checkCorrectTrezorAttached () {
    return true
    /* Must be called with lock acquired
    if (this.accounts.length > 0) {
      const expectedFirstAccount = this.accounts[0]
      let actualFirstAccount = await this._addressFromId(0)
      if (expectedFirstAccount !== actualFirstAccount) {
        throw new Error(
          `Incorrect Trezor device attached - expected device containg account ${expectedFirstAccount}, but found ${actualFirstAccount}`
        )
      }
    }*/
  }

  _derivePath (i) {
    return this.hdPath + '/' + i
  }

  _personalToRawSig (TrezorSig) {
    var v = TrezorSig['v'] - 27
    v = v.toString(16)
    if (v.length < 2) {
      v = '0' + v
    }
    return '0x' + TrezorSig['r'] + TrezorSig['s'] + v
  }
}

TrezorKeyring.type = keyringType
module.exports = TrezorKeyring
