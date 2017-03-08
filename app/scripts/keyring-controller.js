const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const bip39 = require('bip39')
const EventEmitter = require('events').EventEmitter
const ObservableStore = require('obs-store')
const filter = require('promise-filter')
const encryptor = require('browser-passworder')
const sigUtil = require('eth-sig-util')
const normalizeAddress = sigUtil.normalize
// Keyrings:
const SimpleKeyring = require('eth-simple-keyring')
const HdKeyring = require('eth-hd-keyring')
const keyringTypes = [
  SimpleKeyring,
  HdKeyring,
]

class KeyringController extends EventEmitter {

  // PUBLIC METHODS
  //
  // THE FIRST SECTION OF METHODS ARE PUBLIC-FACING,
  // MEANING THEY ARE USED BY CONSUMERS OF THIS CLASS.
  //
  // THEIR SURFACE AREA SHOULD BE CHANGED WITH GREAT CARE.

  constructor (opts) {
    super()
    const initState = opts.initState || {}
    this.keyringTypes = keyringTypes
    this.store = new ObservableStore(initState)
    this.memStore = new ObservableStore({
      isUnlocked: false,
      keyringTypes: this.keyringTypes.map(krt => krt.type),
      keyrings: [],
      identities: {},
    })
    this.ethStore = opts.ethStore
    this.encryptor = encryptor
    this.keyrings = []
    this.getNetwork = opts.getNetwork
  }

  // Full Update
  // returns Promise( @object state )
  //
  // Emits the `update` event and
  // returns a Promise that resolves to the current state.
  //
  // Frequently used to end asynchronous chains in this class,
  // indicating consumers can often either listen for updates,
  // or accept a state-resolving promise to consume their results.
  //
  // Not all methods end with this, that might be a nice refactor.
  fullUpdate () {
    this.emit('update')
    return Promise.resolve(this.memStore.getState())
  }

  // Create New Vault And Keychain
  // @string password - The password to encrypt the vault with
  //
  // returns Promise( @object state )
  //
  // Destroys any old encrypted storage,
  // creates a new encrypted store with the given password,
  // randomly creates a new HD wallet with 1 account,
  // faucets that account on the testnet.
  createNewVaultAndKeychain (password) {
    return this.persistAllKeyrings(password)
    .then(this.createFirstKeyTree.bind(this))
    .then(this.fullUpdate.bind(this))
  }

  // CreateNewVaultAndRestore
  // @string password - The password to encrypt the vault with
  // @string seed - The BIP44-compliant seed phrase.
  //
  // returns Promise( @object state )
  //
  // Destroys any old encrypted storage,
  // creates a new encrypted store with the given password,
  // creates a new HD wallet from the given seed with 1 account.
  createNewVaultAndRestore (password, seed) {
    if (typeof password !== 'string') {
      return Promise.reject('Password must be text.')
    }

    if (!bip39.validateMnemonic(seed)) {
      return Promise.reject('Seed phrase is invalid.')
    }

    this.clearKeyrings()

    return this.persistAllKeyrings(password)
    .then(() => {
      return this.addNewKeyring('HD Key Tree', {
        mnemonic: seed,
        numberOfAccounts: 1,
      })
    })
    .then((firstKeyring) => {
      return firstKeyring.getAccounts()
    })
    .then((accounts) => {
      const firstAccount = accounts[0]
      if (!firstAccount) throw new Error('KeyringController - First Account not found.')
      const hexAccount = normalizeAddress(firstAccount)
      this.emit('newAccount', hexAccount)
      return this.setupAccounts(accounts)
    })
    .then(this.persistAllKeyrings.bind(this, password))
    .then(this.fullUpdate.bind(this))
  }

  // Set Locked
  // returns Promise( @object state )
  //
  // This method deallocates all secrets, and effectively locks metamask.
  setLocked () {
    // set locked
    this.password = null
    this.memStore.updateState({ isUnlocked: false })
    // remove keyrings
    this.keyrings = []
    this._updateMemStoreKeyrings()
    return this.fullUpdate()
  }

  // Submit Password
  // @string password
  //
  // returns Promise( @object state )
  //
  // Attempts to decrypt the current vault and load its keyrings
  // into memory.
  //
  // Temporarily also migrates any old-style vaults first, as well.
  // (Pre MetaMask 3.0.0)
  submitPassword (password) {
    return this.unlockKeyrings(password)
    .then((keyrings) => {
      this.keyrings = keyrings
      return this.fullUpdate()
    })
  }

  // Add New Keyring
  // @string type
  // @object opts
  //
  // returns Promise( @Keyring keyring )
  //
  // Adds a new Keyring of the given `type` to the vault
  // and the current decrypted Keyrings array.
  //
  // All Keyring classes implement a unique `type` string,
  // and this is used to retrieve them from the keyringTypes array.
  addNewKeyring (type, opts) {
    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring(opts)
    return keyring.deserialize(opts)
    .then(() => {
      return keyring.getAccounts()
    })
    .then((accounts) => {
      return this.checkForDuplicate(type, accounts)
    })
    .then((checkedAccounts) => {
      this.keyrings.push(keyring)
      return this.setupAccounts(checkedAccounts)
    })
    .then(() => this.persistAllKeyrings())
    .then(() => this.fullUpdate())
    .then(() => {
      this._updateMemStoreKeyrings()
      return keyring
    })
  }

  // For now just checks for simple key pairs
  // but in the future
  // should possibly add HD and other types
  //
  checkForDuplicate (type, newAccount) {
    return this.getAccounts()
    .then((accounts) => {
      switch (type) {
        case 'Simple Key Pair':
          let isNotIncluded = !accounts.find((key) => key === newAccount[0] || key === ethUtil.stripHexPrefix(newAccount[0]))
          return (isNotIncluded) ? Promise.resolve(newAccount) : Promise.reject(new Error('The account you\'re are trying to import is a duplicate'))
        default:
          return Promise.resolve(newAccount)
      }
    })
  }


  // Add New Account
  // @number keyRingNum
  //
  // returns Promise( @object state )
  //
  // Calls the `addAccounts` method on the Keyring
  // in the kryings array at index `keyringNum`,
  // and then saves those changes.
  addNewAccount (selectedKeyring) {
    return selectedKeyring.addAccounts(1)
    .then(this.setupAccounts.bind(this))
    .then(this.persistAllKeyrings.bind(this))
    .then(this.fullUpdate.bind(this))
  }

  // Save Account Label
  // @string account
  // @string label
  //
  // returns Promise( @string label )
  //
  // Persists a nickname equal to `label` for the specified account.
  saveAccountLabel (account, label) {
    try {
      const hexAddress = normalizeAddress(account)
      // update state on diskStore
      const state = this.store.getState()
      const walletNicknames = state.walletNicknames || {}
      walletNicknames[hexAddress] = label
      this.store.updateState({ walletNicknames })
      // update state on memStore
      const identities = this.memStore.getState().identities
      identities[hexAddress].name = label
      this.memStore.updateState({ identities })
      return Promise.resolve(label)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Export Account
  // @string address
  //
  // returns Promise( @string privateKey )
  //
  // Requests the private key from the keyring controlling
  // the specified address.
  //
  // Returns a Promise that may resolve with the private key string.
  exportAccount (address) {
    try {
      return this.getKeyringForAccount(address)
      .then((keyring) => {
        return keyring.exportAccount(normalizeAddress(address))
      })
    } catch (e) {
      return Promise.reject(e)
    }
  }


  // SIGNING METHODS
  //
  // This method signs tx and returns a promise for
  // TX Manager to update the state after signing

  signTransaction (ethTx, _fromAddress) {
    const fromAddress = normalizeAddress(_fromAddress)
    return this.getKeyringForAccount(fromAddress)
    .then((keyring) => {
      return keyring.signTransaction(fromAddress, ethTx)
    })
  }

  // Sign Message
  // @object msgParams
  //
  // returns Promise(@buffer rawSig)
  //
  // Attempts to sign the provided @object msgParams.
  signMessage (msgParams) {
    const address = normalizeAddress(msgParams.from)
    return this.getKeyringForAccount(address)
    .then((keyring) => {
      return keyring.signMessage(address, msgParams.data)
    })
  }

  // Sign Personal Message
  // @object msgParams
  //
  // returns Promise(@buffer rawSig)
  //
  // Attempts to sign the provided @object msgParams.
  // Prefixes the hash before signing as per the new geth behavior.
  signPersonalMessage (msgParams) {
    const address = normalizeAddress(msgParams.from)
    return this.getKeyringForAccount(address)
    .then((keyring) => {
      return keyring.signPersonalMessage(address, msgParams.data)
    })
  }

  // PRIVATE METHODS
  //
  // THESE METHODS ARE ONLY USED INTERNALLY TO THE KEYRING-CONTROLLER
  // AND SO MAY BE CHANGED MORE LIBERALLY THAN THE ABOVE METHODS.

  // Create First Key Tree
  // returns @Promise
  //
  // Clears the vault,
  // creates a new one,
  // creates a random new HD Keyring with 1 account,
  // makes that account the selected account,
  // faucets that account on testnet,
  // puts the current seed words into the state tree.
  createFirstKeyTree () {
    this.clearKeyrings()
    return this.addNewKeyring('HD Key Tree', { numberOfAccounts: 1 })
    .then((keyring) => {
      return keyring.getAccounts()
    })
    .then((accounts) => {
      const firstAccount = accounts[0]
      if (!firstAccount) throw new Error('KeyringController - No account found on keychain.')
      const hexAccount = normalizeAddress(firstAccount)
      this.emit('newAccount', hexAccount)
      return this.setupAccounts(accounts)
    })
    .then(this.persistAllKeyrings.bind(this))
  }

  // Setup Accounts
  // @array accounts
  //
  // returns @Promise(@object account)
  //
  // Initializes the provided account array
  // Gives them numerically incremented nicknames,
  // and adds them to the ethStore for regular balance checking.
  setupAccounts (accounts) {
    return this.getAccounts()
    .then((loadedAccounts) => {
      const arr = accounts || loadedAccounts
      return Promise.all(arr.map((account) => {
        return this.getBalanceAndNickname(account)
      }))
    })
  }

  // Get Balance And Nickname
  // @string account
  //
  // returns Promise( @string label )
  //
  // Takes an account address and an iterator representing
  // the current number of named accounts.
  getBalanceAndNickname (account) {
    if (!account) {
      throw new Error('Problem loading account.')
    }
    const address = normalizeAddress(account)
    this.ethStore.addAccount(address)
    return this.createNickname(address)
  }

  // Create Nickname
  // @string address
  //
  // returns Promise( @string label )
  //
  // Takes an address, and assigns it an incremented nickname, persisting it.
  createNickname (address) {
    const hexAddress = normalizeAddress(address)
    const identities = this.memStore.getState().identities
    const currentIdentityCount = Object.keys(identities).length + 1
    const nicknames = this.store.getState().walletNicknames || {}
    const existingNickname = nicknames[hexAddress]
    const name = existingNickname || `Account ${currentIdentityCount}`
    identities[hexAddress] = {
      address: hexAddress,
      name,
    }
    this.memStore.updateState({ identities })
    return this.saveAccountLabel(hexAddress, name)
  }

  // Persist All Keyrings
  // @password string
  //
  // returns Promise
  //
  // Iterates the current `keyrings` array,
  // serializes each one into a serialized array,
  // encrypts that array with the provided `password`,
  // and persists that encrypted string to storage.
  persistAllKeyrings (password = this.password) {
    if (typeof password === 'string') {
      this.password = password
      this.memStore.updateState({ isUnlocked: true })
    }
    return Promise.all(this.keyrings.map((keyring) => {
      return Promise.all([keyring.type, keyring.serialize()])
      .then((serializedKeyringArray) => {
        // Label the output values on each serialized Keyring:
        return {
          type: serializedKeyringArray[0],
          data: serializedKeyringArray[1],
        }
      })
    }))
    .then((serializedKeyrings) => {
      return this.encryptor.encrypt(this.password, serializedKeyrings)
    })
    .then((encryptedString) => {
      this.store.updateState({ vault: encryptedString })
      return true
    })
  }

  // Unlock Keyrings
  // @string password
  //
  // returns Promise( @array keyrings )
  //
  // Attempts to unlock the persisted encrypted storage,
  // initializing the persisted keyrings to RAM.
  unlockKeyrings (password) {
    const encryptedVault = this.store.getState().vault
    if (!encryptedVault) {
      throw new Error('Cannot unlock without a previous vault.')
    }

    return this.encryptor.decrypt(password, encryptedVault)
    .then((vault) => {
      this.password = password
      this.memStore.updateState({ isUnlocked: true })
      vault.forEach(this.restoreKeyring.bind(this))
      return this.keyrings
    })
  }

  // Restore Keyring
  // @object serialized
  //
  // returns Promise( @Keyring deserialized )
  //
  // Attempts to initialize a new keyring from the provided
  // serialized payload.
  //
  // On success, returns the resulting @Keyring instance.
  restoreKeyring (serialized) {
    const { type, data } = serialized

    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring()
    return keyring.deserialize(data)
    .then(() => {
      return keyring.getAccounts()
    })
    .then((accounts) => {
      return this.setupAccounts(accounts)
    })
    .then(() => {
      this.keyrings.push(keyring)
      this._updateMemStoreKeyrings()
      return keyring
    })
  }

  // Get Keyring Class For Type
  // @string type
  //
  // Returns @class Keyring
  //
  // Searches the current `keyringTypes` array
  // for a Keyring class whose unique `type` property
  // matches the provided `type`,
  // returning it if it exists.
  getKeyringClassForType (type) {
    return this.keyringTypes.find(kr => kr.type === type)
  }

  getKeyringsByType (type) {
    return this.keyrings.filter((keyring) => keyring.type === type)
  }

  // Get Accounts
  // returns Promise( @Array[ @string accounts ] )
  //
  // Returns the public addresses of all current accounts
  // managed by all currently unlocked keyrings.
  getAccounts () {
    const keyrings = this.keyrings || []
    return Promise.all(keyrings.map(kr => kr.getAccounts()))
    .then((keyringArrays) => {
      return keyringArrays.reduce((res, arr) => {
        return res.concat(arr)
      }, [])
    })
  }

  // Get Keyring For Account
  // @string address
  //
  // returns Promise(@Keyring keyring)
  //
  // Returns the currently initialized keyring that manages
  // the specified `address` if one exists.
  getKeyringForAccount (address) {
    const hexed = normalizeAddress(address)
    log.debug(`KeyringController - getKeyringForAccount: ${hexed}`)

    return Promise.all(this.keyrings.map((keyring) => {
      return Promise.all([
        keyring,
        keyring.getAccounts(),
      ])
    }))
    .then(filter((candidate) => {
      const accounts = candidate[1].map(normalizeAddress)
      return accounts.includes(hexed)
    }))
    .then((winners) => {
      if (winners && winners.length > 0) {
        return winners[0][0]
      } else {
        throw new Error('No keyring found for the requested account.')
      }
    })
  }

  // Display For Keyring
  // @Keyring keyring
  //
  // returns Promise( @Object { type:String, accounts:Array } )
  //
  // Is used for adding the current keyrings to the state object.
  displayForKeyring (keyring) {
    return keyring.getAccounts()
    .then((accounts) => {
      return {
        type: keyring.type,
        accounts: accounts,
      }
    })
  }

  // Add Gas Buffer
  // @string gas (as hexadecimal value)
  //
  // returns @string bufferedGas (as hexadecimal value)
  //
  // Adds a healthy buffer of gas to an initial gas estimate.
  addGasBuffer (gas) {
    const gasBuffer = new BN('100000', 10)
    const bnGas = new BN(ethUtil.stripHexPrefix(gas), 16)
    const correct = bnGas.add(gasBuffer)
    return ethUtil.addHexPrefix(correct.toString(16))
  }

  // Clear Keyrings
  //
  // Deallocates all currently managed keyrings and accounts.
  // Used before initializing a new vault.
  clearKeyrings () {
    let accounts
    try {
      accounts = Object.keys(this.ethStore.getState())
    } catch (e) {
      accounts = []
    }
    accounts.forEach((address) => {
      this.ethStore.removeAccount(address)
    })

    // clear keyrings from memory
    this.keyrings = []
    this.memStore.updateState({
      keyrings: [],
      identities: {},
    })
  }

  _updateMemStoreKeyrings() {
    Promise.all(this.keyrings.map(this.displayForKeyring))
    .then((keyrings) => {
      this.memStore.updateState({ keyrings })
    })
  }

}

module.exports = KeyringController
