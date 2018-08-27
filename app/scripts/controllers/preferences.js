const ObservableStore = require('obs-store')
const normalizeAddress = require('eth-sig-util').normalize
const extend = require('xtend')


class PreferencesController {

  /**
   *
   * @typedef {Object} PreferencesController
   * @param {object} opts Overrides the defaults for the initial state of this.store
   * @property {object} store The stored object containing a users preferences, stored in local storage
	 * @property {array} store.frequentRpcList A list of custom rpcs to provide the user
   * @property {string} store.currentAccountTab Indicates the selected tab in the ui
   * @property {array} store.tokens The tokens the user wants display in their token lists
   * @property {boolean} store.useBlockie The users preference for blockie identicons within the UI
   * @property {object} store.featureFlags A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature
   * @property {string} store.currentLocale The preferred language locale key
   * @property {string} store.selectedAddress A hex string that matches the currently selected address in the app
   *
   */
  constructor (opts = {}) {
    const initState = extend({
      frequentRpcList: [],
      currentAccountTab: 'history',
      tokens: [],
      useBlockie: false,
      featureFlags: {},
      currentLocale: opts.initLangCode,
      identities: {},
      lostIdentities: {},
    }, opts.initState)

    this.diagnostics = opts.diagnostics

    this.store = new ObservableStore(initState)
  }
// PUBLIC METHODS

  /**
   * Setter for the `useBlockie` property
   *
   * @param {boolean} val Whether or not the user prefers blockie indicators
   *
   */
  setUseBlockie (val) {
    this.store.updateState({ useBlockie: val })
  }

  /**
   * Getter for the `useBlockie` property
   *
   * @returns {boolean} this.store.useBlockie
   *
   */
  getUseBlockie () {
    return this.store.getState().useBlockie
  }

  /**
   * Setter for the `currentLocale` property
   *
   * @param {string} key he preferred language locale key
   *
   */
  setCurrentLocale (key) {
    this.store.updateState({ currentLocale: key })
  }

  /**
   * Updates identities to only include specified addresses. Removes identities
   * not included in addresses array
   *
   * @param {string[]} addresses An array of hex addresses
   *
   */
  setAddresses (addresses) {
    const oldIdentities = this.store.getState().identities
    const identities = addresses.reduce((ids, address, index) => {
      const oldId = oldIdentities[address] || {}
      ids[address] = {name: `Account ${index + 1}`, address, ...oldId}
      return ids
    }, {})
    this.store.updateState({ identities })
  }

  /**
   * Removes an address from state
   *
   * @param {string} address A hex address
   * @returns {string} the address that was removed
   */
  removeAddress (address) {
    const identities = this.store.getState().identities
    if (!identities[address]) {
      throw new Error(`${address} can't be deleted cause it was not found`)
    }
    delete identities[address]
    this.store.updateState({ identities })

    // If the selected account is no longer valid,
    // select an arbitrary other account:
    if (address === this.getSelectedAddress()) {
      const selected = Object.keys(identities)[0]
      this.setSelectedAddress(selected)
    }
    return address
  }


  /**
   * Adds addresses to the identities object without removing identities
   *
   * @param {string[]} addresses An array of hex addresses
   *
   */
  addAddresses (addresses) {
    const identities = this.store.getState().identities
    addresses.forEach((address) => {
      // skip if already exists
      if (identities[address]) return
      // add missing identity
      const identityCount = Object.keys(identities).length
      identities[address] = { name: `Account ${identityCount + 1}`, address }
    })
    this.store.updateState({ identities })
  }

  /*
   * Synchronizes identity entries with known accounts.
   * Removes any unknown identities, and returns the resulting selected address.
   *
   * @param {Array<string>} addresses known to the vault.
   * @returns {Promise<string>} selectedAddress the selected address.
   */
  syncAddresses (addresses) {
    const { identities, lostIdentities } = this.store.getState()

    const newlyLost = {}
    Object.keys(identities).forEach((identity) => {
      if (!addresses.includes(identity)) {
        newlyLost[identity] = identities[identity]
        delete identities[identity]
      }
    })

    // Identities are no longer present.
    if (Object.keys(newlyLost).length > 0) {

      // Notify our servers:
      if (this.diagnostics) this.diagnostics.reportOrphans(newlyLost)

      // store lost accounts
      for (const key in newlyLost) {
        lostIdentities[key] = newlyLost[key]
      }
    }

    this.store.updateState({ identities, lostIdentities })
    this.addAddresses(addresses)

    // If the selected account is no longer valid,
    // select an arbitrary other account:
    let selected = this.getSelectedAddress()
    if (!addresses.includes(selected)) {
      selected = addresses[0]
      this.setSelectedAddress(selected)
    }

    return selected
  }

  /**
   * Setter for the `selectedAddress` property
   *
   * @param {string} _address A new hex address for an account
   * @returns {Promise<void>} Promise resolves with undefined
   *
   */
  setSelectedAddress (_address) {
    return new Promise((resolve, reject) => {
      const address = normalizeAddress(_address)
      this.store.updateState({ selectedAddress: address })
      resolve()
    })
  }

  /**
   * Getter for the `selectedAddress` property
   *
   * @returns {string} The hex address for the currently selected account
   *
   */
  getSelectedAddress () {
    return this.store.getState().selectedAddress
  }

  /**
   * Contains data about tokens users add to their account.
   * @typedef {Object} AddedToken
   * @property {string} address - The hex address for the token contract. Will be all lower cased and hex-prefixed.
   * @property {string} symbol - The symbol of the token, usually 3 or 4 capitalized letters
   *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#symbol}
   * @property {boolean} decimals - The number of decimals the token uses.
   *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#decimals}
   */

  /**
   * Adds a new token to the token array, or updates the token if passed an address that already exists.
   * Modifies the existing tokens array from the store. All objects in the tokens array array AddedToken objects.
   * @see AddedToken {@link AddedToken}
   *
   * @param {string} rawAddress Hex address of the token contract. May or may not be a checksum address.
   * @param {string} symbol The symbol of the token
   * @param {number} decimals  The number of decimals the token uses.
   * @returns {Promise<array>} Promises the new array of AddedToken objects.
   *
   */
  async addToken (rawAddress, symbol, decimals, network) {
    const address = normalizeAddress(rawAddress)
    const newEntry = { address, symbol, decimals, network }

    const tokens = this.store.getState().tokens
    const previousEntry = tokens.find((token, index) => {
      return (token.address === address && parseInt(token.network) === parseInt(network))
    })
    const previousIndex = tokens.indexOf(previousEntry)

    if (previousEntry) {
      tokens[previousIndex] = newEntry
    } else {
      tokens.push(newEntry)
    }

    this.store.updateState({ tokens })

    return Promise.resolve(tokens)
  }

  /**
   * Removes a specified token from the tokens array.
   *
   * @param {string} rawAddress Hex address of the token contract to remove.
   * @returns {Promise<array>} The new array of AddedToken objects
   *
   */
  removeToken (rawAddress) {
    const tokens = this.store.getState().tokens

    const updatedTokens = tokens.filter(token => token.address !== rawAddress)

    this.store.updateState({ tokens: updatedTokens })
    return Promise.resolve(updatedTokens)
  }

  /**
   * A getter for the `tokens` property
   *
   * @returns {array} The current array of AddedToken objects
   *
   */
  getTokens () {
    return this.store.getState().tokens
  }

  /**
   * Sets a custom label for an account
   * @param {string} account the account to set a label for
   * @param {string} label the custom label for the account
   * @return {Promise<string>}
   */
  setAccountLabel (account, label) {
    if (!account) throw new Error('setAccountLabel requires a valid address, got ' + String(account))
    const address = normalizeAddress(account)
    const {identities} = this.store.getState()
    identities[address] = identities[address] || {}
    identities[address].name = label
    this.store.updateState({ identities })
    return Promise.resolve(label)
  }

  /**
   * Gets an updated rpc list from this.addToFrequentRpcList() and sets the `frequentRpcList` to this update list.
   *
   * @param {string} _url The the new rpc url to add to the updated list
   * @returns {Promise<void>} Promise resolves with undefined
   *
   */
  updateFrequentRpcList (_url) {
    return this.addToFrequentRpcList(_url)
      .then((rpcList) => {
        this.store.updateState({ frequentRpcList: rpcList })
        return Promise.resolve()
      })
  }

  /**
   * Setter for the `currentAccountTab` property
   *
   * @param {string} currentAccountTab Specifies the new tab to be marked as current
   * @returns {Promise<void>} Promise resolves with undefined
   *
   */
  setCurrentAccountTab (currentAccountTab) {
    return new Promise((resolve, reject) => {
      this.store.updateState({ currentAccountTab })
      resolve()
    })
  }

  /**
   * Returns an updated rpcList based on the passed url and the current list.
   * The returned list will have an unlimited length. The current list is modified and returned as a promise.
   *
   * @param {string} _url The rpc url to add to the frequentRpcList.
   * @returns {Promise<array>} The updated frequentRpcList.
   *
   */
  addToFrequentRpcList (_url) {
    const rpcList = this.getFrequentRpcList()
    const index = rpcList.findIndex((element) => { return element === _url })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }
    if (_url !== 'http://localhost:8545') {
      rpcList.push(_url)
    }
    return Promise.resolve(rpcList)
  }

  /**
   * Getter for the `frequentRpcList` property.
   *
   * @returns {array<string>} An array of one or two rpc urls.
   *
   */
  getFrequentRpcList () {
    return this.store.getState().frequentRpcList
  }

  /**
   * Removes a specified rpc url from the list.
   *
   * @param {string} url
   * @returns {Promise<array>} The new array of updated RpcList objects
   *
   */
  removeRpcUrl (_url) {
    const rpcList = this.getFrequentRpcList()
    const updatedRpcList = rpcList.filter(rpcUrl => rpcUrl !== _url)
    this.store.updateState({ frequentRpcList: updatedRpcList })

    return Promise.resolve(updatedRpcList)
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param {string} feature A key that corresponds to a UI feature.
   * @param {boolean} activated Indicates whether or not the UI feature should be displayed
   * @returns {Promise<object>} Promises a new object; the updated featureFlags object.
   *
   */
  setFeatureFlag (feature, activated) {
    const currentFeatureFlags = this.store.getState().featureFlags
    const updatedFeatureFlags = {
      ...currentFeatureFlags,
      [feature]: activated,
    }

    this.store.updateState({ featureFlags: updatedFeatureFlags })

    return Promise.resolve(updatedFeatureFlags)
  }

  /**
   * A getter for the `featureFlags` property
   *
   * @returns {object} A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature
   *
   */
  getFeatureFlags () {
    return this.store.getState().featureFlags
  }
  //
  // PRIVATE METHODS
  //
}

module.exports = PreferencesController
