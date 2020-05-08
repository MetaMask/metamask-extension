import ObservableStore from 'obs-store'
import { normalize as normalizeAddress } from 'eth-sig-util'
import { sha3, bufferToHex } from 'ethereumjs-util'

export default class PreferencesController {

  /**
   *
   * @typedef {Object} PreferencesController
   * @param {Object} opts - Overrides the defaults for the initial state of this.store
   * @property {object} store The stored object containing a users preferences, stored in local storage
	 * @property {array} store.frequentRpcList A list of custom rpcs to provide the user
   * @property {string} store.currentAccountTab Indicates the selected tab in the ui
   * @property {boolean} store.useBlockie The users preference for blockie identicons within the UI
   * @property {boolean} store.useNonceField The users preference for nonce field within the UI
   * @property {object} store.featureFlags A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature.
   *
   * Feature flags can be set by the global function `setPreference(feature, enabled)`, and so should not expose any sensitive behavior.
   * @property {object} store.knownMethodData Contains all data methods known by the user
   * @property {string} store.currentLocale The preferred language locale key
   * @property {string} store.selectedAddress A hex string that matches the currently selected address in the app
   *
   */
  constructor (opts = {}) {
    const initState = Object.assign({
      frequentRpcListDetail: [],
      currentAccountTab: 'history',
      useBlockie: false,
      useNonceField: false,
      usePhishDetect: true,

      // WARNING: Do not use feature flags for security-sensitive things.
      // Feature flag toggling is available in the global namespace
      // for convenient testing of pre-release features, and should never
      // perform sensitive operations.
      featureFlags: {
        showIncomingTransactions: true,
        transactionTime: false,
      },
      knownMethodData: {},
      participateInMetaMetrics: null,
      firstTimeFlowType: null,
      currentLocale: opts.initLangCode,
      identities: {},
      lostIdentities: {},
      forgottenPassword: false,
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      completedOnboarding: false,
      metaMetricsId: null,
      metaMetricsSendCount: 0,

      // ENS decentralized website resolution
      ipfsGateway: 'ipfs.dweb.link',
    }, opts.initState)

    this.diagnostics = opts.diagnostics
    this.network = opts.network
    this.store = new ObservableStore(initState)
    this.openPopup = opts.openPopup

    global.setPreference = (key, value) => {
      return this.setFeatureFlag(key, value)
    }
  }
  // PUBLIC METHODS

  /**
   * Sets the {@code forgottenPassword} state property
   * @param {boolean} forgottenPassword - whether or not the user has forgotten their password
   */
  setPasswordForgotten (forgottenPassword) {
    this.store.updateState({ forgottenPassword })
  }

  /**
   * Setter for the `useBlockie` property
   *
   * @param {boolean} val - Whether or not the user prefers blockie indicators
   *
   */
  setUseBlockie (val) {
    this.store.updateState({ useBlockie: val })
  }

  /**
   * Setter for the `useNonceField` property
   *
   * @param {boolean} val - Whether or not the user prefers to set nonce
   *
   */
  setUseNonceField (val) {
    this.store.updateState({ useNonceField: val })
  }

  /**
   * Setter for the `usePhishDetect` property
   *
   * @param {boolean} val - Whether or not the user prefers phishing domain protection
   *
   */
  setUsePhishDetect (val) {
    this.store.updateState({ usePhishDetect: val })
  }

  /**
   * Setter for the `participateInMetaMetrics` property
   *
   * @param {boolean} bool - Whether or not the user wants to participate in MetaMetrics
   * @returns {string|null} - the string of the new metametrics id, or null if not set
   *
   */
  setParticipateInMetaMetrics (bool) {
    this.store.updateState({ participateInMetaMetrics: bool })
    let metaMetricsId = null
    if (bool && !this.store.getState().metaMetricsId) {
      metaMetricsId = bufferToHex(sha3(String(Date.now()) + String(Math.round(Math.random() * Number.MAX_SAFE_INTEGER))))
      this.store.updateState({ metaMetricsId })
    } else if (bool === false) {
      this.store.updateState({ metaMetricsId })
    }
    return metaMetricsId
  }

  getParticipateInMetaMetrics () {
    return this.store.getState().participateInMetaMetrics
  }

  setMetaMetricsSendCount (val) {
    this.store.updateState({ metaMetricsSendCount: val })
  }

  /**
   * Setter for the `firstTimeFlowType` property
   *
   * @param {string} type - Indicates the type of first time flow - create or import - the user wishes to follow
   *
   */
  setFirstTimeFlowType (type) {
    this.store.updateState({ firstTimeFlowType: type })
  }


  /**
   * Add new methodData to state, to avoid requesting this information again through Infura
   *
   * @param {string} fourBytePrefix - Four-byte method signature
   * @param {string} methodData - Corresponding data method
   */
  addKnownMethodData (fourBytePrefix, methodData) {
    const knownMethodData = this.store.getState().knownMethodData
    knownMethodData[fourBytePrefix] = methodData
    this.store.updateState({ knownMethodData })
  }

  /**
   * Setter for the `currentLocale` property
   *
   * @param {string} key - he preferred language locale key
   *
   */
  setCurrentLocale (key) {
    const textDirection = (['ar', 'dv', 'fa', 'he', 'ku'].includes(key)) ? 'rtl' : 'auto'
    this.store.updateState({
      currentLocale: key,
      textDirection: textDirection,
    })
    return textDirection
  }

  /**
   * Updates identities to only include specified addresses. Removes identities
   * not included in addresses array
   *
   * @param {string[]} addresses - An array of hex addresses
   *
   */
  setAddresses (addresses) {
    const oldIdentities = this.store.getState().identities

    const identities = addresses.reduce((ids, address, index) => {
      const oldId = oldIdentities[address] || {}
      ids[address] = { name: `Account ${index + 1}`, address, ...oldId }
      return ids
    }, {})

    this.store.updateState({
      identities,
    })
  }

  /**
   * Removes an address from state
   *
   * @param {string} address - A hex address
   * @returns {string} - the address that was removed
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
   * @param {string[]} addresses - An array of hex addresses
   *
   */
  addAddresses (addresses) {
    const identities = this.store.getState().identities
    addresses.forEach((address) => {
      // skip if already exists
      if (identities[address]) {
        return
      }
      // add missing identity
      const identityCount = Object.keys(identities).length

      identities[address] = { name: `Account ${identityCount + 1}`, address }
    })
    this.store.updateState({
      identities,
    })
  }

  /**
   * Synchronizes identity entries with known accounts.
   * Removes any unknown identities, and returns the resulting selected address.
   *
   * @param {Array<string>} addresses - known to the vault.
   * @returns {Promise<string>} - selectedAddress the selected address.
   */
  syncAddresses (addresses) {

    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Expected non-empty array of addresses.')
    }

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
      if (this.diagnostics) {
        this.diagnostics.reportOrphans(newlyLost)
      }

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
   * @param {string} _address - A new hex address for an account
   *
   */
  setSelectedAddress (_address) {
    const address = normalizeAddress(_address)

    const { identities } = this.store.getState()
    const selectedIdentity = identities[address]
    if (!selectedIdentity) {
      throw new Error(`Identity for '${address} not found`)
    }

    selectedIdentity.lastSelected = Date.now()
    this.store.updateState({ identities, selectedAddress: address })
  }

  /**
   * Getter for the `selectedAddress` property
   *
   * @returns {string} - The hex address for the currently selected account
   *
   */
  getSelectedAddress () {
    return this.store.getState().selectedAddress
  }

  /**
   * Sets a custom label for an account
   * @param {string} account - the account to set a label for
   * @param {string} label - the custom label for the account
   * @returns {Promise<string>}
   */
  setAccountLabel (account, label) {
    if (!account) {
      throw new Error('setAccountLabel requires a valid address, got ' + String(account))
    }
    const address = normalizeAddress(account)
    const { identities } = this.store.getState()
    identities[address] = identities[address] || {}
    identities[address].name = label
    this.store.updateState({ identities })
    return Promise.resolve(label)
  }

  /**
   * updates custom RPC details
   *
   * @param {string} url - The RPC url to add to frequentRpcList.
   * @param {number} chainId - Optional chainId of the selected network.
   * @param {string} ticker   - Optional ticker symbol of the selected network.
   * @param {string} nickname - Optional nickname of the selected network.
   * @returns {Promise<array>} - Promise resolving to updated frequentRpcList.
   *
   */


  updateRpc (newRpcDetails) {
    const rpcList = this.getFrequentRpcListDetail()
    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === newRpcDetails.rpcUrl
    })
    if (index > -1) {
      const rpcDetail = rpcList[index]
      const updatedRpc = { ...rpcDetail, ...newRpcDetails }
      rpcList[index] = updatedRpc
      this.store.updateState({ frequentRpcListDetail: rpcList })
    } else {
      const { rpcUrl, chainId, ticker, nickname, rpcPrefs = {} } = newRpcDetails
      return this.addToFrequentRpcList(rpcUrl, chainId, ticker, nickname, rpcPrefs)
    }
    return Promise.resolve(rpcList)
  }
  /**
   * Adds custom RPC url to state.
   *
   * @param {string} url - The RPC url to add to frequentRpcList.
   * @param {number} chainId - Optional chainId of the selected network.
   * @param {string} ticker   - Optional ticker symbol of the selected network.
   * @param {string} nickname - Optional nickname of the selected network.
   * @returns {Promise<array>} - Promise resolving to updated frequentRpcList.
   *
   */
  addToFrequentRpcList (url, chainId, ticker = 'ETH', nickname = '', rpcPrefs = {}) {
    const rpcList = this.getFrequentRpcListDetail()
    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === url
    })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }
    if (url !== 'http://localhost:8545') {
      let checkedChainId
      if (!!chainId && !Number.isNaN(parseInt(chainId))) {
        checkedChainId = chainId
      }
      rpcList.push({ rpcUrl: url, chainId: checkedChainId, ticker, nickname, rpcPrefs })
    }
    this.store.updateState({ frequentRpcListDetail: rpcList })
    return Promise.resolve(rpcList)
  }

  /**
   * Removes custom RPC url from state.
   *
   * @param {string} url - The RPC url to remove from frequentRpcList.
   * @returns {Promise<array>} - Promise resolving to updated frequentRpcList.
   *
   */
  removeFromFrequentRpcList (url) {
    const rpcList = this.getFrequentRpcListDetail()
    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === url
    })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }
    this.store.updateState({ frequentRpcListDetail: rpcList })
    return Promise.resolve(rpcList)
  }

  /**
   * Getter for the `frequentRpcListDetail` property.
   *
   * @returns {array<array>} - An array of rpc urls.
   *
   */
  getFrequentRpcListDetail () {
    return this.store.getState().frequentRpcListDetail
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param {string} feature - A key that corresponds to a UI feature.
   * @param {boolean} activated - Indicates whether or not the UI feature should be displayed
   * @returns {Promise<object>} - Promises a new object; the updated featureFlags object.
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
   * Updates the `preferences` property, which is an object. These are user-controlled features
   * found in the settings page.
   * @param {string} preference - The preference to enable or disable.
   * @param {boolean} value - Indicates whether or not the preference should be enabled or disabled.
   * @returns {Promise<object>} - Promises a new object; the updated preferences object.
   */
  setPreference (preference, value) {
    const currentPreferences = this.getPreferences()
    const updatedPreferences = {
      ...currentPreferences,
      [preference]: value,
    }

    this.store.updateState({ preferences: updatedPreferences })
    return Promise.resolve(updatedPreferences)
  }

  /**
   * A getter for the `preferences` property
   * @returns {Object} - A key-boolean map of user-selected preferences.
   */
  getPreferences () {
    return this.store.getState().preferences
  }

  /**
   * Sets the completedOnboarding state to true, indicating that the user has completed the
   * onboarding process.
   */
  completeOnboarding () {
    this.store.updateState({ completedOnboarding: true })
    return Promise.resolve(true)
  }

  /**
   * A getter for the `ipfsGateway` property
   * @returns {string} - The current IPFS gateway domain
   */
  getIpfsGateway () {
    return this.store.getState().ipfsGateway
  }

  /**
   * A setter for the `ipfsGateway` property
   * @param {string} domain - The new IPFS gateway domain
   * @returns {Promise<string>} - A promise of the update IPFS gateway domain
   */
  setIpfsGateway (domain) {
    this.store.updateState({ ipfsGateway: domain })
    return Promise.resolve(domain)
  }

}
