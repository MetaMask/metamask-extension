import { Exception } from '@zxing/library'
import { EventEmitter } from 'events'
import fetch from 'node-fetch'
import { TransactionFactory } from '@ethereumjs/tx'
import { toBuffer, bnToHex } from 'ethereumjs-util'
import WordArray from 'crypto-js/lib-typedarrays'
import HmacSHA256 from 'crypto-js/hmac-sha256'


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * At 01:02:03.456 on Jan 23, 2022, it will return 220123010203456
   * @return {number}
   */
function getYyMmDdHhMmSsFff() {
  const now = new Date()
  const year = now.getUTCFullYear() % 100
  const month = now.getUTCMonth() + 1
  const dayOfMonth = now.getUTCDate()
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  const second = now.getUTCSeconds()
  const milli = now.getUTCMilliseconds()
  const ret = ((((((year * 100) + month) * 100 + dayOfMonth) * 100 + hour) * 100 + minute) * 100 + second) * 1000 + milli
  return ret
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class WalletSpecifierNumeric {
  /**
   * Ctor
   *
   * @param {number} [mnemonicId]
   * @param {number} [passphraseId]
   * @param {number} [keyIndex]
   */
  constructor(
    mnemonicId,
    passphraseId,
    keyIndex
  ) {
    /**
     * Mnemonic ID
     * @type {number}
     */
    this.mnemonicId = mnemonicId
    /**
     * Passphrase ID
     * @type {number}
     */
    this.passphraseId = passphraseId
    /**
     * Key index
     * @type {number}
     */
    this.keyIndex = keyIndex
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class SignerAccountProps {
  /**
   * Ctor
   *
   * @param {string} [address]
   * @param {WalletSpecifierNumeric} [walletSpecifier]
   */
  constructor(address, walletSpecifier) {
    /**
     * Hex address
     * @type {string}
     */
    this.address = address
    /**
     * Wallet specifier
     * @type {WalletSpecifierNumeric}
     */
    this.walletSpecifier = walletSpecifier
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class AccountDataForPage {
  /**
   * Ctor
   *
   * @param {string} [address]
   * @param {number} [balance]
   * @param {number} [index]
   */
  constructor(address, balance, index) {
    /**
     * Hex address
     * @type {string}
     */
    this.address = address
    /**
     * ETH balance
     * @type {number}
     */
    this.balance = balance
    /**
     * aka keyIndex
     * @type {number}
     */
    this.index = index
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class AlcSignerKeyringOpts {
  /**
   * Ctor
   *
   * @param {string} [signerApiToken]
   * @param {SignerAccountPropsount[]} [accounts]
   * @param {string} [signerDomain]
   * @param {number} [mnemonicId]
   * @param {string} [keyId]
   * @param {string} [secretKey]
   */
  constructor(signerApiToken = '', accounts = [], signerDomain = '127.0.0.1:2025', mnemonicId = 0, keyId = '', secretKey = '') {
    /**
     * Signer's REST API token
     * @type {string}
     */
    this.signerApiToken = signerApiToken
    /**
     * List of accounts (addresses) recognized so far
     * @type {SignerAccountProps[]}
     */
    this.accounts = accounts
    /**
     * Signer domain e.g. `signer-tokyo:2020`
     * @type {string}
     */
    this.signerDomain = signerDomain
    /**
     * Mnemonic ID, with an assumption that it's equal to a passphrase ID
     * @type {number}
     */
    this.mnemonicId = mnemonicId
    /**
     * Signer API key (public part)
     * @type {string}
     */
    this.keyId = keyId
    /**
     * Signer API key (secret part)
     * @type {string}
     */
    this.secretKey = secretKey
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class SigningError extends Error {
  /**
   * Ctor
   *
   * @param {string} msg
   * @param {number} requestId
   * @param {object} error
   */
  constructor(msg, requestId, error) {
    super(msg)
    /**
     * Identifies the offending request
     * @type {number}
     */
    this.requestId = requestId
    /**
     * Opaque object which might or might not be useful in error handling...
     * @type {object}
     */
    this.error = error

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SigningError)
    }

    /**
     * Error type
     * @type {string}
     */
    this.name = 'SigningError'
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const NUM_ADDR_PER_PAGE = 5

class AlcSignerKeyring extends EventEmitter {

  /**
   * Keyring type as a static property
   * @type {string}
   */
  static type = 'AlcSignerKeyring'

  /**
   * Ctor
   *
   * @param {AlcSignerKeyringOpts} opts
   */
  constructor(opts) {
    super()

    /**
     * Keyring type as an instance property (we seem to need both)
     * @type {string}
     */
    this.type = AlcSignerKeyring.type

    if (!opts) {
        opts = new AlcSignerKeyringOpts()
    }
    /**
     * Options which actually contains the whole internal state
     * @type {AlcSignerKeyringOpts}
     */
    this.opts = opts
    /**
     * maps a hex addr to the corresponding wallet specifier triple
     * @type {Map<String, WalletSpecifierNumeric>}
     */
    this.addrToWalletSpecifier = this._addrToWalletSpecifier(opts)

    /**
     * used internally by getFirstPage() etc
     * @type {number}
     */
    this.pageIdx = 0
    /**
     * associates getFirstPage() etc with addNewAccount()
     * @type {AccountDataForPage[]}
     */
    this.page = null
    /**
     * used internally by getFirstPage() etc
     * @type {number}
     */
    this.unlockedAccount = 0
  }

  /**
   * Returns a map from an address to a wallet specifier
   *
   * @param {AlcSignerKeyringOpts} [opts]
   * @return {Map<string, WalletSpecifierNumeric>}
   */
  _addrToWalletSpecifier(opts) {
    const ret = new Map()
    for (const a of opts.accounts) {
      ret.set(a.address.toLowerCase(), a.walletSpecifier)
    }
    return ret
  }

  /**
   * Output configs for MetaMask to encrypt and store to disk
   *
   * @return {AlcSignerKeyringOpts}
   */
  async serialize() {
    return this.opts
  }

  /**
   * Read decrypted configs from disk
   *
   * @param {AlcSignerKeyringOpts} opts
   */
  async deserialize(opts) {
    this.opts = opts
    this.addrToWalletSpecifier = this._addrToWalletSpecifier(opts)
  }

  async addAccounts(n = 1) {
    for (let i = 0; i < n; i++) {
      const j = i + this.unlockedAccount - NUM_ADDR_PER_PAGE * this.pageIdx
      console.log('addAccounts', n, j)
      const addr = this.page[j].address
      const lower = addr.toLowerCase()
      if ( ! this.addrToWalletSpecifier.has(lower)) {
        const mnemonicId = this.opts.mnemonicId
        const keyIndex = NUM_ADDR_PER_PAGE * this.pageIdx + j
        const specifier = new WalletSpecifierNumeric(mnemonicId, mnemonicId, keyIndex)
        this.opts.accounts.push(new SignerAccountProps(addr, specifier))
        this.addrToWalletSpecifier.set(lower, specifier)
      }
    }
    return this.getAccounts()
  }

  async getAccounts() {
    return this.opts.accounts.map((x) => x.address)
  }

  async forgetDevice() {
    console.log('forgetDevice')
    this.opts.accounts = []
    this.addrToWalletSpecifier = new Map()
    this.pageIdx = 0
    this.page = null
    this.unlockedAccount = 0
  }

  /**
   * Signs
   *
   * @param {string} address
   * @param {Transaction|AccessListEIP2930Transaction|FeeMarketEIP1559Transaction} transaction
   * @return {Transaction|AccessListEIP2930Transaction|FeeMarketEIP1559Transaction} signed version of `transaction` param
   */
  async signTransaction(address, transaction) {
    const walletSpecifier = this.addrToWalletSpecifier.get(address.toLowerCase())
    console.log('addrToWalletSpecifier', this.addrToWalletSpecifier, 'addr', address, 'ret', walletSpecifier)
    if ( ! walletSpecifier) {
      throw new SigningError(`unknown address ${address}`, 0, transaction)
    }
    const txData = transaction.toJSON()
    txData.gas = txData.gasLimit
    delete txData.gasLimit
    const chainId = bnToHex(transaction.common.chainIdBN())
    txData.chainId = chainId
    console.log('tx', txData)
    const signReq = {
      requestId: getYyMmDdHhMmSsFff(),
      numeric: walletSpecifier,
      data: txData
    }

    const keyId = this.opts.keyId
    const secretKey = this.opts.secretKey
    const nonce = `${WordArray.random(16).toString()}-${1e-3 * Date.now()}`
    const hmac = HmacSHA256(nonce, secretKey)  // TODO sign the whole payload with JWT
    const headers = {
      'Content-Type': 'application/json',
      SIGNER_ACCESS_KEY_ID: keyId,
      SIGNER_NONCE: nonce,
      SIGNER_HS256: hmac.toString(),
    }
    const resp = await fetch(`http://${this.opts.signerDomain}/sign`, {
      method: 'post',
      body: JSON.stringify(signReq),
      headers
    })
    const respJson = await resp.json()
    if ('signed' in respJson) {
      const rawTxHex = respJson.signed.rawTransaction
      const rawTx = toBuffer(rawTxHex)
      const ret = TransactionFactory.fromSerializedData(rawTx)
      return ret
    }
    throw new SigningError(JSON.stringify(respJson.error) + ' from ' + JSON.stringify(signReq),
      respJson.requestId, respJson.error)
  }

  async signMessage(address, data, opts = {}) {
  }

  async signPersonalMessage(address, msgHex, opts = {}) {
  }

  async signTypedData(withAccount, typedData, opts = { version: 'V1' }) {
  }

  async getEncryptionPublicKey(address) {
    let me = 'getEncryptionPublicKey'
    throw Exception(`${this.type} doestn't support ${me}`)
  }

  async decryptMessage(address, data) {
    let me = 'decryptMessage'
    throw Exception(`${this.type} doestn't support ${me}`)
  }

  async exportAccount(address) {
    return 'AlphaLab Signer never exposes private keys it manages by design'
  }

  async removeAccount(address) {
    // stolen from eth-trezor-keyring
    address = address.toLowerCase()
    if (
      !this.opts.accounts.map((a) => a.address.toLowerCase()).includes(address)
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this.opts.accounts = this.opts.accounts.filter(
      (a) => a.address.toLowerCase() !== address,
    )
    // TODO addrToWalletSpecifier
  }

  async getAlcSignerDesc() {
    return "foobar"
  }

  /**
   * Actually configures Signer endpoint
   *
   * @param {string} hdPath `m/${signer domain}/${mnemonic selector}/${keyId}/${secretKey}
   *  e.g. `m/signer-tokyo:2020/0/ops/Cv_ZOA-.0u`
   */
  setHdPath(hdPath) {
    const xs = hdPath.split('/')
    // xs[0] == 'm'
    const domain = xs[1]
    const mnemonicId = parseInt(xs[2])
    const keyId = xs[3]
    const secretKey = xs[4]

    if (!domain) {
      this.opts.signerDomain = domain
    }
    if (!isNaN(mnemonicId)) {
      this.opts.mnemonicId = mnemonicId
    }
    if (keyId) {
      this.opts.keyId = keyId
    }
    if (secretKey) {
      this.opts.secretKey = secretKey
    }
    console.log('setHdPath', hdPath, domain, mnemonicId, keyId, secretKey)
  }

  async _hasPreviousTransactions (address) {
    const apiUrl = this._getApiUrl()
    const response = await window.fetch(`${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1&offset=1`)
    const parsedResponse = await response.json()
    if (parsedResponse.status !== '0' && parsedResponse.result.length > 0) {
      return true
    }
    return false
  }

  async _getPage() {
    const mnemonicId = this.opts.mnemonicId
    const uri = `http://${this.opts.signerDomain}/accounts/${mnemonicId}/${this.pageIdx}`
    const resp = await fetch(uri)
    const respJson = await resp.json()
    const ret = []
    respJson.forEach((addr, i) => {
      const keyIndex = NUM_ADDR_PER_PAGE * this.pageIdx + i
      ret.push(new AccountDataForPage(addr, null, keyIndex))
    })
    this.page = ret
    return ret
  }

  async getFirstPage() {
    console.log('getFirstPage')
    this.pageIdx = 0
    return await this._getPage()
  }

  async getNextPage() {
    console.log('getNextPage', this.pageIdx, ' -> ', this.pageIdx + 1)
    this.pageIdx += 1
    return await this._getPage()
  }

  async getPreviousPage() {
    console.log('getPreviousPage', this.pageIdx, ' -> ', this.pageIdx - 1)
    this.pageIdx -= 1
    if (this.pageIdx < 0) {
      this.pageIdx = 0
    }
    return await this._getPage()
  }

  /**
   * Prepares for the next, actual unlocking action
   *
   * @param {string} index
   */
  setAccountToUnlock(index) {
    this.unlockedAccount = parseInt(index, 10)
    console.log('setAccountToUnlock', this.unlockedAccount)
  }
}

export default AlcSignerKeyring
