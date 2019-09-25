const ObservableStore = require('obs-store')
const EventEmitter = require('safe-event-emitter')
const extend = require('xtend')

const assetRequiredFields = ['symbol', 'balance', 'identifier', 'decimals', 'customViewUrl']

class AssetsController extends EventEmitter {

  constructor (opts = {}) {
    super()
    const initState = extend({
      assets: [{
        symbol: 'TEST_ASSET',
        balance: '200000',
        identifier: 'test:asset',
        decimals: 5,
        customViewUrl: 'https://metamask.io',
      }],
    }, opts.initState)
    this.store = new ObservableStore(initState)
  }

  // Asset management
  get assets () {
    return this.store.getState().assets
  }

  set assets (assets) {
    this.store.updateState({
      assets,
    })
  }

  addAsset (fromDomain, opts) {
    this.validateAsset(fromDomain, opts)
    const asset = {
      ...opts,
      fromDomain,
    }
    this.assets.push(asset)
  }

  validateAsset (fromDomain, opts) {
    assetRequiredFields.forEach((requiredField) => {
      if (!(requiredField in opts)) {
        throw new Error(`Asset from ${fromDomain} missing required field: ${requiredField}`)
      }
    })
  }
  updateAsset(fromDomain, asset) {
    this.validateAsset(fromDomain, asset)
    this.assets.forEach((asset, index) => {
      if (asset.fromDomain === fromDomain && asset.identifier === identifier) {
        this.assets[index] = asset
      }
    })
  }

  removeAsset(fromDomain, asset) {
    this.assets = this.assets.filter((asset, index) => {
      const requested = asset.fromDomain === fromDomain && asset.identifier === identifier
      return !requested
    })
  }

}

module.exports = AssetsController
