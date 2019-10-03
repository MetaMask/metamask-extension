const ObservableStore = require('obs-store')
const EventEmitter = require('safe-event-emitter')
const extend = require('xtend')

const assetRequiredFields = ['symbol', 'balance', 'identifier', 'decimals', 'customViewUrl']

class AssetsController extends EventEmitter {

  constructor (opts = {}) {
    super()
    const initState = extend({
      assets: [],
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
    const priors = this.getPriorAssets(fromDomain, opts)
    if (priors.length > 0) {
      return this.updateAsset(fromDomain, opts)
    }

    const asset = {
      ...opts,
    }
    asset.fromDomain = fromDomain
    this.assets.push(asset)
    return asset
  }

  getPriorAssets (fromDomain, asset) {
    return this.assets.filter((asset2) => {
      return asset2.fromDomain === fromDomain && asset.identifier === asset2.identifier
    })
  }

  validateAsset (fromDomain, opts) {
    assetRequiredFields.forEach((requiredField) => {
      if (!(requiredField in opts)) {
        throw new Error(`Asset from ${fromDomain} missing required field: ${requiredField}`)
      }
    })
  }

  updateAsset (fromDomain, asset) {
    this.validateAsset(fromDomain, asset)
    this.assets = this.assets.map((asset2) => {
      if (asset2.fromDomain === fromDomain && asset.identifier === asset2.identifier) {
        return asset
      } else {
        return asset2
      }
    })
    return asset
  }

  removeAsset (fromDomain, asset) {
    let deleted
    this.assets = this.assets.filter((asset2) => {
      const requested = asset2.fromDomain === fromDomain && asset.identifier === asset2.identifier
      deleted = requested
      return !requested
    })
    return deleted
  }

}

module.exports = AssetsController
