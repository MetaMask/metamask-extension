import { EventEmitter } from 'events'

import ethUtil from 'ethereumjs-util'
import HDKey from 'hdkey'

const hdPathString = `m/44'/60'/0'`
const keyringType = 'Bidirectional QrCode Device'
const pathBase = 'm'
const MAX_INDEX = 1000

class BidirectionalQrAccountKeyring extends EventEmitter {
  constructor(opts = {}) {
    super()
    this.type = keyringType
    this.accounts = []
    this.page = 0
    this.perPage = 5
    this.unlockedAccount = 0
    this.xpub = ''
    this.paths = {}
    this.deserialize(opts)
  }

  serialize() {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      page: this.page,
      paths: this.paths,
      perPage: this.perPage,
      unlockedAccount: this.unlockedAccount,
      xpub: this.xpub,
    })
  }

  deserialize(opts = {}) {
    this.hdPath = opts.hdPath || hdPathString
    this.accounts = opts.accounts || []
    this.page = opts.page || 0
    this.perPage = opts.perPage || 5
    this.xpub = opts.xpub
    return Promise.resolve()
  }

  setAccountToUnlock(index) {
    this.unlockedAccount = parseInt(index, 10)
  }

  addAccounts(n = 1) {
    return new Promise((resolve, reject) => {
      try {
        const from = this.unlockedAccount
        const to = from + n
        this.accounts = []

        for (let i = from; i < to; i++) {
          const address = this._addressFromIndex(pathBase, i)
          this.accounts.push(address)
          this.page = 0
        }
        resolve(this.accounts)
      } catch (e) {
        reject(e)
      }
    })
  }

  getFirstPage() {
    this.page = 0
    return this.__getPage(1)
  }

  getNextPage() {
    return this.__getPage(1)
  }

  getPreviousPage() {
    return this.__getPage(-1)
  }

  __getPage(increment) {
    this.page += increment

    if (this.page <= 0) {
      this.page = 1
    }

    return new Promise((resolve, reject) => {
      try {
        const from = (this.page - 1) * this.perPage
        const to = from + this.perPage

        const accounts = []

        for (let i = from; i < to; i++) {
          const address = this._addressFromIndex(pathBase, i)
          accounts.push({
            address,
            balance: null,
            index: i,
          })
          this.paths[ethUtil.toChecksumAddress(address)] = i
        }
        resolve(accounts)
      } catch (e) {
        reject(e)
      }
    })
  }

  getAccounts() {
    return Promise.resolve(this.accounts.slice())
  }

  removeAccount(address) {
    if (
      !this.accounts.map((a) => a.toLowerCase()).includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.accounts = this.accounts.filter(
      (a) => a.toLowerCase() !== address.toLowerCase(),
    )
  }

  // // tx is an instance of the ethereumjs-transaction class.
  // signTransaction(address, tx) {
  //   return new Promise((resolve, reject) => {
  //     this.unlock()
  //       .then((status) => {
  //         setTimeout(
  //           (_) => {
  //             TrezorConnect.ethereumSignTransaction({
  //               path: this._pathFromAddress(address),
  //               transaction: {
  //                 to: this._normalize(tx.to),
  //                 value: this._normalize(tx.value),
  //                 data: this._normalize(tx.data),
  //                 chainId: tx._chainId,
  //                 nonce: this._normalize(tx.nonce),
  //                 gasLimit: this._normalize(tx.gasLimit),
  //                 gasPrice: this._normalize(tx.gasPrice),
  //               },
  //             })
  //               .then((response) => {
  //                 if (response.success) {
  //                   tx.v = response.payload.v
  //                   tx.r = response.payload.r
  //                   tx.s = response.payload.s
  //
  //                   const signedTx = new Transaction(tx)
  //
  //                   const addressSignedWith = ethUtil.toChecksumAddress(
  //                     `0x${signedTx.from.toString('hex')}`,
  //                   )
  //                   const correctAddress = ethUtil.toChecksumAddress(address)
  //                   if (addressSignedWith !== correctAddress) {
  //                     reject(
  //                       new Error('signature doesnt match the right address'),
  //                     )
  //                   }
  //
  //                   resolve(signedTx)
  //                 } else {
  //                   reject(
  //                     new Error(
  //                       (response.payload && response.payload.error) ||
  //                         'Unknown error',
  //                     ),
  //                   )
  //                 }
  //               })
  //               .catch((e) => {
  //                 reject(new Error((e && e.toString()) || 'Unknown error'))
  //               })
  //
  //             // This is necessary to avoid popup collision
  //             // between the unlock & sign trezor popups
  //           },
  //           status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0,
  //         )
  //       })
  //       .catch((e) => {
  //         reject(new Error((e && e.toString()) || 'Unknown error'))
  //       })
  //   })
  // }
  //
  // signMessage(withAccount, data) {
  //   return this.signPersonalMessage(withAccount, data)
  // }
  //
  // // For personal_sign, we need to prefix the message:
  // signPersonalMessage(withAccount, message) {
  //   return new Promise((resolve, reject) => {
  //     this.unlock()
  //       .then((status) => {
  //         setTimeout(
  //           (_) => {
  //             TrezorConnect.ethereumSignMessage({
  //               path: this._pathFromAddress(withAccount),
  //               message: ethUtil.stripHexPrefix(message),
  //               hex: true,
  //             })
  //               .then((response) => {
  //                 if (response.success) {
  //                   if (
  //                     response.payload.address !==
  //                     ethUtil.toChecksumAddress(withAccount)
  //                   ) {
  //                     reject(
  //                       new Error('signature doesnt match the right address'),
  //                     )
  //                   }
  //                   const signature = `0x${response.payload.signature}`
  //                   resolve(signature)
  //                 } else {
  //                   reject(
  //                     new Error(
  //                       (response.payload && response.payload.error) ||
  //                         'Unknown error',
  //                     ),
  //                   )
  //                 }
  //               })
  //               .catch((e) => {
  //                 console.log('Error while trying to sign a message ', e)
  //                 reject(new Error((e && e.toString()) || 'Unknown error'))
  //               })
  //             // This is necessary to avoid popup collision
  //             // between the unlock & sign trezor popups
  //           },
  //           status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0,
  //         )
  //       })
  //       .catch((e) => {
  //         console.log('Error while trying to sign a message ', e)
  //         reject(new Error((e && e.toString()) || 'Unknown error'))
  //       })
  //   })
  // }
  //
  // signTypedData(withAccount, typedData) {
  //   // Waiting on trezor to enable this
  //   return Promise.reject(new Error('Not supported on this device'))
  // }
  //
  // exportAccount(address) {
  //   return Promise.reject(new Error('Not supported on this device'))
  // }

  forgetDevice() {
    this.accounts = []
    this.hdk = new HDKey()
    this.page = 0
    this.unlockedAccount = 0
    this.paths = {}
  }

  /* PRIVATE METHODS */

  _normalize(buf) {
    return ethUtil.bufferToHex(buf).toString()
  }

  _addressFromIndex(pb, i) {
    if (!this.hdk) {
      this.hdk = HDKey.fromExtendedKey(this.xpub)
    }
    const dkey = this.hdk.derive(`${pb}/0/${i}`)
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex')
    return ethUtil.toChecksumAddress(address)
  }

  _pathFromAddress(address) {
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
}

BidirectionalQrAccountKeyring.type = keyringType
export default BidirectionalQrAccountKeyring
