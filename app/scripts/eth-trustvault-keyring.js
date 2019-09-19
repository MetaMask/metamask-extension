const { EventEmitter } = require('events')
const { GraphQLClient } = require('graphql-request')
const hdPathString = `m/44'/60'/0'/0`
const ethUtil = require('ethereumjs-util')
const type = 'TrustVault'
const log = require('loglevel')
const trustVaultBridgeUrl = 'https://nssykwnfn5eyffdizlucp6oifi.appsync-api.eu-west-1.amazonaws.com/graphql'
const apiKey = 'da2-mfgyzj7ltjhdne7mohvjskqizm'
import BigNumber from 'bignumber.js'
// seconds x milliseconds
const FIVE_MINUTES_IN_MILLISECONDS = 300 * 1000
const UNSUPPORTED_SIGNING_METHOD = "You are currently using a TrustVault account.\n\nTrustVault does currently not support this transaction type,\nplease choose another account to proceed.";

class TrustvaultKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = type
    this.unlockedAccount = 0
    this.deserialize(opts)
    this.client = new GraphQLClient(trustVaultBridgeUrl)
    this.client.setHeader('x-api-key', apiKey)
    this.pinChallenge = {
      email: null,
      sessionToken: null
    }
  }

  serialize () {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      addressNameMap: this.addressNameMap,
      auth: this.auth,
      unlockedAccount: this.unlockedAccount,
    })
  }

  deserialize (opts = {}) {
    this.hdPath = opts.hdPath || hdPathString
    this.auth = opts.auth
    this.accounts = opts.accounts || []
    this.addressNameMap = opts.addressNameMap || []
    return Promise.resolve()
  }

  isUnlocked () {
    return !!this.auth 
  }

  unlock () {
    if (!this.auth) {
    return Promise.reject({ message: 'TrustVault tokens have expired. Connect to TrustVault again.'})
    }
    return Promise.resolve('already unlocked')
  }

  setAccountToUnlock (index) {
    log.log('setAccountToUnlock')
  }

  addAccounts (n = 1) {
    log.log('addAccounts')
  }

  updateAuthKey (auth) {
    this.auth = auth
  }

  forgetDevice () {
    this.accounts = []
    this.auth = undefined
    this.paths = {}
  }

  async getAccounts () {
    if (!this.auth) {
      log.error('User not authenticated in TrustVault')
      return []
    }
    if (this.accounts.length > 0 && this.dateAccountsWereLastFetched && this.dateAccountsWereLastFetched + FIVE_MINUTES_IN_MILLISECONDS > Date.now()) {
      log.log('returning already stored accounts')
      return this.accounts
    }
    try {
      this.accounts = await this._getAccounts()
      this.dateAccountsWereLastFetched = Date.now()
    } catch (err) {
      log.error('Error getting accounts', err)
      return []
ˆ    }

    return this.accounts
  }

  async signTransaction (address, tx) {
    const transactionDigest = this._getTransactionDigest(tx)
    const transaction = this._constructTrustTransaction(tx)
    const { v, r, s } = await this._signTransaction(address, transaction, transactionDigest)
    tx.v = Buffer.from(v, 'hex')
    tx.r = Buffer.from(r, 'hex')
    tx.s = Buffer.from(s, 'hex')
    const valid = tx.verifySignature()
    if (!valid) {
      throw new Error('Signatures on the transactions are invalid.')
    }
    return tx
  }

  signMessage (withAccount, data) {
    log.log('sign message', withAccount, data)
    alert(UNSUPPORTED_SIGNING_METHOD)
  }

  signPersonalMessage (withAccount, mshHex) {
    log.log('sign message', withAccount, mshHex)
    alert(UNSUPPORTED_SIGNING_METHOD)
  }

  signTypedData (withAccount, typedDate) {
    log.log('signTypedData', withAccount, typedDate)
    alert(UNSUPPORTED_SIGNING_METHOD)
  }

  getAccountNames(){
    return this.addressNameMap
  }

  submitPartialPinChallenge (firstPinDigit, secondPinDigit) {
    const { email, sessionToken } = this.pinChallenge
    try {
      return this._getAuthenticationTokens(email, firstPinDigit, secondPinDigit, sessionToken)
    } catch (err) {
      log.error(err)
      throw err
    }
  }

  getPartialPinChallenge (email) {
    try {
      return this._getPartialPinChallenge(email)
    } catch (err) {
      log.error(err)
      throw err
    }
  }

  /* Private Methods */

  async _getPartialPinChallenge (email) {
    const query = this._getPartialPinChallengeQuery(email)
    const { getPartialPinChallenge, error } = await this.client.request(query).catch(this.handleGraphQlError);

    // Set pinChallenge details
    this.pinChallenge.email = email
    if (getPartialPinChallenge) {
      this.pinChallenge.sessionToken = getPartialPinChallenge.sessionToken
    }

    return {
      pinChallenge: getPartialPinChallenge,
      error,
    }
  }

  async _getAuthenticationTokens (email, firstPinDigit, secondPinDigit, sessionToken) {
    const query = this._getAuthTokenQuery(email, firstPinDigit, secondPinDigit, sessionToken)
    const { getAuthenticationTokens, error } = await this.client.request(query).catch(this.handleGraphQlError);
    const { authentication: auth, pinChallenge } = getAuthenticationTokens

    if (pinChallenge && pinChallenge.sessionToken) {
      this.pinChallenge.sessionToken = pinChallenge.sessionToken
    }

    return { auth, pinChallenge, error }
  }

  async _getAccounts () {
    const accounts = (await this._request(this._getAccountsQuery, {})).userWallet.getAccounts
    this.addressNameMap = accounts.map(account => { return { name: account.accountName, address: account.address } })
    return accounts.map(account => account.address.toLowerCase())
  }

  async _request (constructQuery, queryContext) {
    try {
      const query = constructQuery(this.auth, queryContext)
      const response = await this.client.request(query)
      log.info(response)
      return response
    } catch (e) {
      log.error(e)
      if (e.message.substring(0, 21) === 'INVALID_SESSION_TOKEN') {
        try {
          const query = this._refreshAuthTokensQuery(this.auth)
          const tokens = await this.client.request(query)
          this.auth = tokens.refreshAuthenticationTokens
          return await this._request(constructQuery, queryContext)
        } catch (error) {
          log.warn('TrustVault session has expired. Connect to TrustVault again', error)
          this.accounts = []
          this.auth = null
          throw new Error('TrustVault session has expired. Connect to TrustVault again')
        }
      }
      throw e
    }
  }

  async _signTransaction (address, tx, transactionDigest) {
    let transactionId
    try {
      const data = await this._request(this._getSignTransactionMutation, { tx, transactionDigest, address })
      transactionId = data.requestSignature.transactionId
      log.info('transactionId', transactionId)
    } catch (err) {
      log.error('error when sending transaction mutation', err)
      throw err
    }
    if (transactionId) {
      const { transaction: { v, r, s } } = await this._pollTransaction(transactionId)
      return { v, r, s }
    }
  }

  _getTransactionDigest (tx) {
    const transactionDigest = tx.hash(false).toString('hex')
    return transactionDigest
  }

  _constructTrustTransaction (tx) {
    const transaction = {
      nonce: tx.nonce.length > 0 ? this._normalizeNum(tx.nonce) : 0,
      gasPrice: this._normalizeNum(tx.gasPrice),
      gasLimit: this._normalizeNum(tx.gasLimit),
      to: this._normalize(tx.to),
      value: tx.value.length > 0 ? this._normalizeNum(tx.value) : 0,
      chainId: tx._chainId,
      v: tx._chainId
    }
    if (this._normalize(tx.data) !== '0x') {
      transaction.data = this._normalize(tx.data).toString()
    }
    log.log('TRANSACTION: ', transaction)
    return transaction
  }

  async _pollTransaction (transactionId, retryCount = 0, errorCount=0) {
    try {
      const result = await this._request(this._getTransactionInfoQuery, { transactionId })
      const { status, signedTransaction } = result.userWallet.getTransactionInfo
      if (status === 'SIGNED') {
        return signedTransaction
      }else if(status === 'USER_CANCELLED') {
        return Promise.reject('Transaction cancelled by user')
      }else if(status === 'ERROR'){
        return Promise.reject('Signing the transaction errored')
      } 
      else {
        if (retryCount > 600) {
          throw new Error('Timeout on waiting for signatures')
        }
        retryCount++
        await this._timeout(1000)
        return this._pollTransaction(transactionId, retryCount, 0)
      }
    } catch (e) {
      await this._timeout(5000)
      log.error(`Polling errored with `,e)
      if(errorCount > 3) {
        return Promise.reject(e)
      }
      this._pollTransaction(transactionId, retryCount, errorCount++ )
    }
  }

  handleGraphQlError({ response: { errors, data } }) {
    const { errorType, message } = errors[0]
    const result = {
      error: { code: errorType, message }
    };
    return data
      ? { ...result, ...data } 
      : result
  }

  /* GraphQL queries */
  _getAccountsQuery (auth) {
    return `query {
      userWallet(
        authentication: {
          enc: "${auth.enc}",
          iv: "${auth.iv}",
          tag: "${auth.tag}"
        }
      ) {
        getAccounts {
          address
          accountName
        }
      }
    }`
  }

  _refreshAuthTokensQuery (auth) {
    return `query {
      refreshAuthenticationTokens(
        authentication: {
          enc: "${auth.enc}",
          iv: "${auth.iv}",
          tag: "${auth.tag}"
        }
      ) {
        enc,
        iv,
        tag
      }
    }`
  }

  _getAuthTokenQuery (email, firstPinDigit, secondPinDigit, sessionToken) {
    return `query {
      getAuthenticationTokens(
        getAuthenticationTokensInput: {
          email: "${email}",
          pinChallenge: {
            firstPinDigit: "${firstPinDigit}",
            secondPinDigit: "${secondPinDigit}",
            sessionToken: "${sessionToken}"
          }
        }
      ) {
        authentication {
          enc,
          iv,
          tag
        },
        pinChallenge {
          firstPinDigitPosition,
          secondPinDigitPosition,
          sessionToken
        }
      }
    }`
  }

  _getPartialPinChallengeQuery (email) {
    return `query {
      getPartialPinChallenge(email: "${email}") {
        firstPinDigitPosition,
        secondPinDigitPosition,
        sessionToken
      }
    }`
  }

  _getSignTransactionMutation (auth, { tx, address, transactionDigest }) {
    return `mutation {
      requestSignature(
        requestSignatureInput: {
          authentication: {
            enc: "${auth.enc}",
            iv: "${auth.iv}",
            tag: "${auth.tag}"
          },
          transaction: {
            nonce: ${tx.nonce},
            chainId: ${tx.chainId},
            gasPrice: "${tx.gasPrice}",
            gasLimit: "${tx.gasLimit}",
            value: "${tx.value}",
            fromAddress: "${address}",
            ${
              tx.data ? `data: "${tx.data}",` : ""
            }
            to: "${tx.to}",
            v:${tx.v}
          },
          transactionDigest: "${transactionDigest}",
          source: "MetaMask"
        }
      ) {
        transactionId
      }
    }`
  }

  _getTransactionInfoQuery (auth, requestContext) {
    return `query {
        userWallet(
          authentication: {
            enc: "${auth.enc}",
            iv: "${auth.iv}",
            tag:" ${auth.tag}"
          }
        ) {
          getTransactionInfo(transactionId: "${requestContext.transactionId}") {
            status
            signedTransaction {
              transactionDigest
              transaction {
                  to
                  value
                  chainId
                  nonce
                  gasLimit
                  gasPrice
                  fromAddress
                  r
                  s
                  v
                }
              }
              status
            }
          }
        }`
  }

  /* Helper functions */

  _normalize (buf) {
    return ethUtil.bufferToHex(buf).toString()
  }

  _normalizeNum (buf) {
    return new BigNumber(ethUtil.bufferToHex(buf)).toString(10)
  }

  _timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

TrustvaultKeyring.type = type
module.exports = TrustvaultKeyring
