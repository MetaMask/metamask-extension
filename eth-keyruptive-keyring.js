import { toBuffer } from 'ethereumjs-util'
import KeyruptiveConnect from './KeyruptiveConnect'
import Transaction from 'ethereumjs-tx';


const { EventEmitter } = require('events')
const HDKey = require('hdkey')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')

const Wallet = require('ethereumjs-wallet')

const type = 'Keyruptive Multicloud'
const MAX_INDEX = 1000
const NETWORK_API_URLS = {
  ropsten: 'http://api-ropsten.etherscan.io',
  kovan: 'http://api-kovan.etherscan.io',
  rinkeby: 'https://api-rinkeby.etherscan.io',
  mainnet: 'https://api.etherscan.io',
}

const Web3 = require("web3");

class KeyruptiveKeyring extends EventEmitter {

  constructor (opts) {
    super()


    this.wallets = []


    this.accountIndexes = {}
    this.type = type
    this.page = 0
    this.perPage = 5
    this.unlockedAccount = 0
    this.hdk = new Wallet()
    //this.paths = {}
    this.iframe = null
    this.network = 'mainnet'
    this.deserialize(opts)
    //this._setupIframe()
    
  }

  serialize () {
    
    return Promise.resolve({
      accounts: this.accounts,
      accountIndexes: this.accountIndexes,
    })
  }


  deserialize (opts = {}) {
    this.accounts = opts.accounts || []
    this.accountIndexes = opts.accountIndexes || {}

      // Remove accounts that don't have corresponding account indexes
      this.accounts = this.accounts
        .filter((account) => Object.keys(this.accountIndexes).includes(ethUtil.toChecksumAddress(account)))
    return Promise.resolve()

  }




    




  async unlock () {


      if (this.isUnlocked()) {
        return Promise.resolve('already unlocked')
      }

      return new Promise(async (resolve, reject)  =>  {
              
        resolve("") // return the address
      });
 
  }

    //this function changes the array of addresses with the added addresses
  addAccounts (n = 1) {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then(async (_) => {

          const from = this.unlockedAccount
          const to = from + n
          this.accounts = []

          for (let i = from; i < to; i++) {

            const address = KeyruptiveConnect.getAccounts(i).address
            
            this.accounts.push(address)
            this.accountIndexes[ethUtil.toChecksumAddress(address)] = i
            this.page = 0
          }
          resolve(this.accounts) //resolves with the new accounts
        })
        .catch((e) => {
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

  getAccounts () {
    return Promise.resolve(this.accounts.slice()) // returns a copy of the accounts
  }


  
  removeAccount (address) {
    if (!this.accounts.map((a) => a.toLowerCase()).includes(address.toLowerCase())) {
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.accounts = this.accounts.filter((a) => a.toLowerCase() !== address.toLowerCase())
    delete this.accountIndexes[ethUtil.toChecksumAddress(address)]
  }

 isUnlocked () {
    return Boolean(this.hdk && this.hdk.publicKey)
    return false
  }

  setAccountToUnlock (index) {
    this.unlockedAccount = parseInt(index, 10)
  }





  /**
   * @private
   */

  async __getPage (increment) {

    this.page += increment

    if (this.page <= 0) {
      this.page = 1
    }
    const from = (this.page - 1) * this.perPage
    const to = from + this.perPage

    let accounts = [{}]

      //await this.unlock()

    await KeyruptiveConnect.getAccountsCloud().then(resolve => {
       accounts = resolve
    })

    return accounts
    
  }












  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (address, tx) {


    /**
      "0xdda5c8d91688a7926d75fb9ea5e715589577dfa7"
      ["0x","0x2e55530600","0x5208","0xaed690d32b54c4d54dd838c8c186a87b497f8913","0xe8d4a51000","0x","0x1c","0x","0x"]
     */
    alert(JSON.stringify(Transaction))
    alert(JSON.stringify(tx))
    return new Promise((resolve, reject) => {
      this.unlock()
        .then((_) => {

          tx.v = ethUtil.bufferToHex(tx.getChainId())
          tx.r = '0x00'
          tx.s = '0x00'
          alert(JSON.stringify(tx))

       /*   const providerRopsten = new Web3.providers.WebsocketProvider(
            "wss://ropsten.infura.io/ws/v3/23431f59720a43e7b7b7878f3b1446a9"
        );
          const ropsten = new Web3(providerRopsten);
*/
          //alert(JSON.stringify(ropsten))

          
          var trs = new Transaction(tx, { chain: 'ropsten'})

          alert(JSON.stringify(trs))

        const private_key = Buffer.from('889df3db1a76727e360848f61b15690e5009e6dbcf94a81b54d6abf5923812ef', 'hex')

          trs.sign(private_key)

          var serializedTx = trs.serialize();
          var raw = '0x' + serializedTx.toString('hex');  

            
            //var receipt = ropsten.eth.sendSignedTransaction(raw);

            resolve(tx)

/*
          this._sendMessage({
            action: 'ledger-sign-transaction',
            params: {
              tx: tx.serialize().toString('hex'),
              hdPath,
              to: ethUtil.bufferToHex(tx.to).toLowerCase(),
            },
          },
          ({ success, payload }) => {
            if (success) {

              tx.v = Buffer.from(payload.v, 'hex')
              tx.r = Buffer.from(payload.r, 'hex')
              tx.s = Buffer.from(payload.s, 'hex')

              const valid = tx.verifySignature()
              if (valid) {
                resolve(tx)
              } else {
                reject(new Error('Ledger: The transaction signature is not valid'))
              }
            } else {
              reject(new Error(payload.error || 'Ledger: Unknown error while signing transaction'))
            }
          })*/
        })
    })
    throw new Error('Not supported on this device')
  }
  

  signMessage (withAccount, data) {
    throw new Error('Not supported on this device')
    //return this.signPersonalMessage(withAccount, data)
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage (withAccount, message) {
    /*return new Promise((resolve, reject) => {
      this.unlock()
        .then((_) => {
          let hdPath
          if (this._isBIP44()) {
            const checksummedAddress = ethUtil.toChecksumAddress(withAccount)
            if (!Object.keys(this.accountIndexes).includes(checksummedAddress)) {
              reject(new Error(`Ledger: Index for address '${checksummedAddress}' not found`))
            }
            hdPath = this._getPathForIndex(this.accountIndexes[checksummedAddress])
          } else {
            hdPath = this._toLedgerPath(this._pathFromAddress(withAccount))
          }

          this._sendMessage({
            action: 'ledger-sign-personal-message',
            params: {
              hdPath,
              message: ethUtil.stripHexPrefix(message),
            },
          },
          ({ success, payload }) => {
            if (success) {
              let v = payload.v - 27
              v = v.toString(16)
              if (v.length < 2) {
                v = `0${v}`
              }
              const signature = `0x${payload.r}${payload.s}${v}`
              const addressSignedWith = sigUtil.recoverPersonalSignature({ data: message, sig: signature })
              if (ethUtil.toChecksumAddress(addressSignedWith) !== ethUtil.toChecksumAddress(withAccount)) {
                reject(new Error('Ledger: The signature doesnt match the right address'))
              }
              resolve(signature)
            } else {
              reject(new Error(payload.error || 'Ledger: Uknown error while signing message'))
            }
          })
        })
    })*/
  }

  signTypedData () {
    throw new Error('Not supported on this device')
  }

  exportAccount () {
    throw new Error('Not supported on this device')
  }

  forgetDevice () {
    this.accounts = []
    this.page = 0
    this.unlockedAccount = 0
    this.hdk = new Wallet()
  }

  /* PRIVATE METHODS */

  _setupIframe () {
    /*this.iframe = document.createElement('iframe')
    this.iframe.src = this.bridgeUrl
    document.head.appendChild(this.iframe)*/
  }

  _getOrigin () {
    /*const tmp = this.bridgeUrl.split('/')
    tmp.splice(-1, 1)
    return tmp.join('/')*/
  }

  _sendMessage (msg, cb) {
    throw new Error('Not supported on this device')
    /*msg.target = 'LEDGER-IFRAME'
    this.iframe.contentWindow.postMessage(msg, '*')
    const eventListener = ({ origin, data }) => {
      if (origin !== this._getOrigin()) {
        return false
      }
      if (data && data.action && data.action === `${msg.action}-reply`) {
        cb(data)
        return undefined
      }
      window.removeEventListener('message', eventListener)
      return undefined
    }
    window.addEventListener('message', eventListener)*/
  }




/*
  _padLeftEven (hex) {
    return hex.length % 2 === 0 ? hex : `0${hex}`
  }

  _normalize (buf) {
    return this._padLeftEven(ethUtil.bufferToHex(buf).toLowerCase())
  }*/



  // eslint-disable-next-line no-shadow
  /*_addressFromIndex (pathBase, i) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`)
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex')
    return ethUtil.toChecksumAddress(address)
  }*/

 


  _toAscii (hex) {
    let str = ''
    let i = 0
    const l = hex.length
    if (hex.substring(0, 2) === '0x') {
      i = 2
    }
    for (; i < l; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16)
      str += String.fromCharCode(code)
    }

    return str
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

  _getApiUrl () {
    return NETWORK_API_URLS[this.network] ? NETWORK_API_URLS[this.network] : NETWORK_API_URLS.mainnet
  }




}

KeyruptiveKeyring.type = type
module.exports = KeyruptiveKeyring