const ObservableStore = require('obs-store')
const Box = require('3box')

class ThreeBoxController {
  constructor (opts = {}) {
    const { preferencesController, keyringController, provider } = opts

    this.preferencesController = preferencesController
    this.keyringController = keyringController
    this.provider = provider

    const initState = {
      syncDone3Box: false,
      threeBoxAddress: null,
      preferNoSync: null,
      ...opts.initState,
    }
    this.store = new ObservableStore(initState)

    this.init()
  }

  async init () {
    const accounts = await this.keyringController.getAccounts()
    this.address = accounts[0]
    if (this.address) {
      await this.new3Box(this.address)
    }
  }

  async _update3Box ({ type }, newState) {
    await this.box.private.set(type, JSON.stringify(newState))
  }

  async new3Box (address, forceNewThreeBoxApproval) {
    if (!forceNewThreeBoxApproval && this.store.getState().preferNoSync) {
      return
    }

    this.store.updateState({ syncDone3Box: false })
    this.address = address

    try {
      this.box = await Box.openBox(address, {
        ...this.provider,
        sendAsync: (req, cb) => {
          req.origin = 'MetaMask'
          req.params = [...req.params, { isMetaMask3BoxApproval: true }]
          return this.provider.sendAsync(req, cb)
        },
      })
      this.box && this.box.onSyncDone(() => {
        this._restoreFrom3Box()
        this.store.updateState({ syncDone3Box: true, threeBoxAddress: this.address })
      })
    } catch (e) {
      if (e.message.match(/User denied message signature/)) {
        this.store.updateState({ preferNoSync: true })
      } else {
        console.error(e)
      }
    }
  }

  async _restoreFrom3Box () {
    const backedUpPreferences = await this.box.private.get('preferences')
    backedUpPreferences && this.preferencesController.store.updateState(JSON.parse(backedUpPreferences))
    this._registerUpdates()
    this.store.updateState({ syncDone3Box: true, threeBoxAddress: this.address })
  }

  getThreeBoxAddress () {
    return this.store.getState().threeBoxAddress
  }

  _registerUpdates () {
    const updatePreferences = this._update3Box.bind(this, { type: 'preferences' })
    this.preferencesController.store.subscribe(updatePreferences)
  }
}

module.exports = ThreeBoxController
