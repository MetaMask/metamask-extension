const ObservableStore = require('obs-store')
const Box = require('3box/dist/3box.min')

class ThreeBoxController {
  constructor (opts = {}) {
    const { preferencesController, keyringController, provider } = opts

    this.preferencesController = preferencesController
    this.keyringController = keyringController
    this.provider = provider

    const initState = {
      threeBoxAddress: null,
      threeboxSyncing: true,
      ...opts.initState,
      syncDone3Box: false,
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
    const threeBoxSyncing = this.store.getState().threeboxSyncing
    if (threeBoxSyncing) {
      await this.box.private.set(type, JSON.stringify(newState))
    }
  }

  async new3Box (address) {
    const threeBoxSyncing = this.store.getState().threeboxSyncing
    console.log('new3Box threeBoxSyncing', threeBoxSyncing)
    if (threeBoxSyncing) {
      this.store.updateState({ syncDone3Box: false })
      this.address = address

      try {
        const messageDataToSign = '0x' + Buffer.from('This app wants to view and update your 3Box profile.', 'utf8').toString('hex')
        this.keyringController.signPersonalMessage({
          data: messageDataToSign,
          from: address,
        })
          .then(signature => Box.openBox(
            address,
            this.provider,
            {
              contentSignature: signature,
            }
          ))
          .then(box => {
            this.box = box
            box.onSyncDone(() => {
              console.log('3box onSyncDone!')
              this._restoreFrom3Box()
              this.store.updateState({ syncDone3Box: true, threeBoxAddress: address })
            })
          })
      } catch (e) {
        console.error(e)
      }
    }
  }

  async _restoreFrom3Box () {
    const threeBoxSyncing = this.store.getState().threeboxSyncing
    if (threeBoxSyncing) {
      const backedUpPreferences = await this.box.private.get('preferences')
      backedUpPreferences && this.preferencesController.store.updateState(JSON.parse(backedUpPreferences))
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

  getThreeBoxAddress () {
    return this.box && this.store.getState().threeBoxAddress
  }

  _registerUpdates () {
    const updatePreferences = this._update3Box.bind(this, { type: 'preferences' })
    this.preferencesController.store.subscribe(updatePreferences)
  }
}

module.exports = ThreeBoxController
