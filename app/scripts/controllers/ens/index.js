const ethUtil = require('ethereumjs-util')
const ObservableStore = require('obs-store')
const punycode = require('punycode')
const Ens = require('./ens')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_X_ERROR_ADDRESS = '0x'

class EnsController {
  constructor ({ ens, provider, networkStore } = {}) {
    const initState = {
      ensResolutionsByAddress: {},
    }

    this._ens = ens
    if (!this._ens) {
      const network = networkStore.getState()
      if (Ens.getNetworkEnsSupport(network)) {
        this._ens = new Ens({
          network,
          provider,
        })
      }
    }

    this.store = new ObservableStore(initState)
    networkStore.subscribe((network) => {
      this.store.putState(initState)
      this._ens = new Ens({
        network,
        provider,
      })
    })
  }

  reverseResolveAddress (address) {
    return this._reverseResolveAddress(ethUtil.toChecksumAddress(address))
  }

  async _reverseResolveAddress (address) {
    if (!this._ens) {
      return undefined
    }

    const state = this.store.getState()
    if (state.ensResolutionsByAddress[address]) {
      return state.ensResolutionsByAddress[address]
    }

    const domain = await this._ens.reverse(address)
    const registeredAddress = await this._ens.lookup(domain)
    if (registeredAddress === ZERO_ADDRESS || registeredAddress === ZERO_X_ERROR_ADDRESS) {
      return undefined
    }

    if (ethUtil.toChecksumAddress(registeredAddress) !== address) {
      return undefined
    }

    this._updateResolutionsByAddress(address, punycode.toASCII(domain))
    return domain
  }

  _updateResolutionsByAddress (address, domain) {
    const oldState = this.store.getState()
    this.store.putState({
      ensResolutionsByAddress: {
        ...oldState.ensResolutionsByAddress,
        [address]: domain,
      },
    })
  }
}

module.exports = EnsController
