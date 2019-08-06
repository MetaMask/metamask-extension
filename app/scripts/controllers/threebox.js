const ObservableStore = require('obs-store')
const Box = require('3box/dist/3box.min')
const log = require('loglevel')

const JsonRpcEngine = require('json-rpc-engine')
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine')
const createMetamaskMiddleware = require('./network/createMetamaskMiddleware')
const createOriginMiddleware = require('../lib/createOriginMiddleware')

class ThreeBoxController {
  constructor (opts = {}) {
    const {
      preferencesController,
      keyringController,
      addressBookController,
      version,
      getKeyringControllerState,
      getSelectedAddress,
      signPersonalMessage,
    } = opts

    this.preferencesController = preferencesController
    this.addressBookController = addressBookController
    this.keyringController = keyringController
    this.provider = this._createProvider({
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      },
      version,
      getAccounts: async ({ origin }) => {
        if (origin !== '3Box') { return [] }
        const isUnlocked = getKeyringControllerState().isUnlocked

        const selectedAddress = getSelectedAddress()

        if (isUnlocked && selectedAddress) {
          return [selectedAddress]
        } else {
          return []
        }
      },
      processPersonalMessage: (msgParams) => {
        return Promise.resolve(signPersonalMessage(msgParams))
      },
    })

    const initState = {
      threeBoxAddress: null,
      threeboxSyncing: false,
      ...opts.initState,
      syncDone3Box: false,
    }
    this.store = new ObservableStore(initState)

    this.init()
  }

  async init () {
    const accounts = await this.keyringController.getAccounts()
    this.address = accounts[0]
    if (this.address && !(this.box && this.store.getState().syncDone3Box)) {
      await this.new3Box(this.address)
    }
  }

  async _update3Box ({ type }, newState) {
    const threeBoxSyncing = this.getThreeBoxSyncingState()
    if (threeBoxSyncing) {
      await this.space.private.set(type, JSON.stringify(newState))
    }
  }

  _createProvider (providerOpts) {
    const metamaskMiddleware = createMetamaskMiddleware(providerOpts)
    const engine = new JsonRpcEngine()
    engine.push(createOriginMiddleware({ origin: '3Box' }))
    engine.push(metamaskMiddleware)
    const provider = providerFromEngine(engine)
    return provider
  }

  async new3Box (address, restoreLocalData) {
    let threeBoxSyncing
    if (restoreLocalData) {
      threeBoxSyncing = true
      const currentState = this.store.getState()
      this.store.updateState({
        ...currentState,
        threeboxSyncing: true,
      })
    } else {
      threeBoxSyncing = this.store.getState().threeboxSyncing
    }

    if (threeBoxSyncing) {
      this.store.updateState({ syncDone3Box: false })
      this.address = address

      try {
        this.box = await Box.openBox(address, this.provider)
        this.space = await this.box.openSpace('metamask', {
          onSyncDone: () => {
            log.debug('3Box onSyncDone')
            if (restoreLocalData) {
              this._restoreFrom3Box()
            }
            this.store.updateState({
              syncDone3Box: true,
              threeBoxAddress: address,
            })
          },
        })
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  async _restoreFrom3Box () {
    const threeBoxSyncing = this.getThreeBoxSyncingState()
    if (threeBoxSyncing) {
      const backedUpPreferences = await this.space.private.get('preferences')
      backedUpPreferences && this.preferencesController.store.updateState(JSON.parse(backedUpPreferences))
      const backedUpAddressBook = await this.space.private.get('addressBook')
      backedUpAddressBook && this.addressBookController.update(JSON.parse(backedUpAddressBook), true)
      this._registerUpdates()
      this.store.updateState({ syncDone3Box: true, threeBoxAddress: this.address })
    }
  }

  setThreeBoxSyncing (newThreeboxSyncingState) {
    const currentState = this.store.getState()
    this.store.updateState({
      ...currentState,
      threeboxSyncing: newThreeboxSyncingState,
    })

    if (newThreeboxSyncingState && !(this.box && currentState.syncDone3Box)) {
      this.init()
    }

    if (!newThreeboxSyncingState && this.box) {
      this.box.logout()
    }
  }

  getThreeBoxSyncingState () {
    return this.store.getState().threeboxSyncing
  }

  getThreeBoxAddress () {
    return this.box && this.store.getState().threeBoxAddress
  }

  _registerUpdates () {
    const updatePreferences = this._update3Box.bind(this, { type: 'preferences' })
    this.preferencesController.store.subscribe(updatePreferences)
    const updateAddressBook = this._update3Box.bind(this, { type: 'addressBook' })
    this.addressBookController.subscribe(updateAddressBook)
  }
}

module.exports = ThreeBoxController
