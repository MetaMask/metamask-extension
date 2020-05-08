import ObservableStore from 'obs-store'
import { isValidAddress, toChecksumAddress } from 'ethereumjs-util'
import { addInternalMethodPrefix } from './permissions'

import {
  ComposableController,
  NetworkController,
  PreferencesController,
  AssetsDetectionController,
  AssetsContractController,
} from 'gaba'

class Tokens {
  constructor (opts = {}) {
    const initState = Object.assign({
      assetImages: {},
      allCollectibleContracts: {},
      allCollectibles: {},
      allTokens: {},
      collectibleContracts: [],
      collectibles: [],
      ignoredCollectibles: [],
      ignoredTokens: [],
      suggestedTokens: {},
      tokens: [],

    }, opts.initState)
    this.provider = opts.provider
    this.preferences = opts.preferences
    this.network = opts.network
    this.assets = opts.assets
    this.openPopup = opts.openPopup
    this.store = new ObservableStore(initState)
    this.dataModel = new ComposableController([
      new NetworkController(),
      new PreferencesController(),
      new AssetsDetectionController(),
      new AssetsContractController(),
      opts.assets,
    ])
    this.initialize()
    this._subscribePreferences()
    this._subscribeAssets()
    this._subscribeNetwork()
  }

  initialize () {

    const {
      AssetsContractController: assetsContract,
      AssetsController: assetsController,
      NetworkController: networkController,
    } = this.dataModel.context

    const provider = this.provider
    const state = this.store.getState()
    const { type } = this.network.providerStore.getState()

    assetsContract.configure({ provider })
    networkController.setProviderType(type)
    assetsController.update(state)
  }

  _subscribeNetwork () {
    const {
      NetworkController: networkController,
    } = this.dataModel.context
    this._network = this.network
    this._network.providerStore.subscribe(({ type }) => {
      if (this.type !== type) {
        this.type = type
        networkController.setProviderType(type)
      }
    })
  }

  _subscribePreferences () {
    const {
      PreferencesController: preferences,
    } = this.dataModel.context

    this._preferences = this.preferences
    this._preferences.store.subscribe(({ selectedAddress }) => {
      if (this.selectedAddress !== selectedAddress) {
        this.selectedAddress = selectedAddress
        preferences.setSelectedAddress(selectedAddress)
      }
    })
  }

  _subscribeAssets () {
    const {
      AssetsController: assetsController,
    } = this.dataModel.context

    assetsController.subscribe((state) => {
      this.store.updateState(state)
    })
  }

  removeAccountAssets (accountAddress) {
    const {
      AssetsController: assetsController,
    } = this.dataModel.context

    const { allTokens, allCollectibles, allCollectibleContracts } = assetsController.state
    const checksumAddress = toChecksumAddress(accountAddress)

    delete allTokens[checksumAddress]
    delete allCollectibles[checksumAddress]
    delete allCollectibleContracts[checksumAddress]
  }

  /**
   * RPC engine middleware for requesting new asset added
   *
   * @param req
   * @param res
   * @param {Function} - next
   * @param {Function} - end
   */

  async requestWatchAsset (req, res, next, end) {
    if (
      req.method === 'metamask_watchAsset' ||
      req.method === addInternalMethodPrefix('watchAsset')
    ) {
      const { type, options } = req.params
      switch (type) {
        case 'ERC20':
          const result = await this._handleWatchAssetERC20(options)
          if (result instanceof Error) {
            end(result)
          } else {
            res.result = result
            end()
          }
          break
        default:
          end(new Error(`Asset of type ${type} not supported`))
      }
    } else {
      next()
    }
  }

  addSuggestedERC20Asset (tokenOpts) {
    this._validateERC20AssetParams(tokenOpts)
    const suggested = this.getSuggestedTokens()
    const { checksumAddress, symbol, decimals, image } = tokenOpts
    const newEntry = { address: checksumAddress, symbol, decimals, image }
    suggested[checksumAddress] = newEntry
    this.store.updateState({ suggestedTokens: suggested })
  }

  getSuggestedTokens () {
    return this.store.getState().suggestedTokens
  }

  /**
   * A getter for the `tokens` property
   *
   * @returns {array} - The current array of AddedToken objects
   *
   */
  getTokens () {
    return this.store.getState().tokens
  }

  removeSuggestedTokens () {
    return new Promise((resolve) => {
      this.store.updateState({ suggestedTokens: {} })
      resolve({})
    })
  }


  //
  // PRIVATE METHODS
  //


  /**
   * Handle the suggestion of an ERC20 asset through `watchAsset`
   * *
   * @param {Promise} promise - Promise according to addition of ERC20 token
   *
   */
  async _handleWatchAssetERC20 (options) {
    const { address, symbol, decimals, image } = options
    const checksumAddress = toChecksumAddress(address)
    try {
      this._validateERC20AssetParams({ checksumAddress, symbol, decimals })
    } catch (err) {
      return err
    }
    const tokenOpts = { checksumAddress, decimals, symbol, image }
    this.addSuggestedERC20Asset(tokenOpts)
    return this.openPopup().then(() => {
      const tokenAddresses = this.getTokens().filter((token) => token.address === checksumAddress)
      return tokenAddresses.length > 0
    })
  }

  /**
   * Validates that the passed options for suggested token have all required properties.
   *
   * @param {Object} opts - The options object to validate
   * @throws {string} Throw a custom error indicating that address, symbol and/or decimals
   * doesn't fulfill requirements
   *
   */
  _validateERC20AssetParams (opts) {
    const { checksumAddress, symbol, decimals } = opts
    if (!checksumAddress || !symbol || typeof decimals === 'undefined') {
      throw new Error(`Cannot suggest token without address, symbol, and decimals`)
    }
    if (!(symbol.length < 7)) {
      throw new Error(`Invalid symbol ${symbol} more than six characters`)
    }
    const numDecimals = parseInt(decimals, 10)
    if (isNaN(numDecimals) || numDecimals > 36 || numDecimals < 0) {
      throw new Error(`Invalid decimals ${decimals} must be at least 0, and not over 36`)
    }
    if (!isValidAddress(checksumAddress)) {
      throw new Error(`Invalid address ${checksumAddress}`)
    }
  }
}

export default Tokens
