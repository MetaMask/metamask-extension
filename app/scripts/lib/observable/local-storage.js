const ObservableStore = require('./index')

//
// LocalStorageStore
//
// uses localStorage instead of a cache
//

class LocalStorageStore extends ObservableStore {

  constructor (opts) {
    super()
    delete this._state

    this._opts = opts || {}
    if (!this._opts.storageKey) {
      throw new Error('LocalStorageStore - no "storageKey" specified')
    }
    this._storageKey = this._opts.storageKey
  }

  get() {
    try {
      return JSON.parse(global.localStorage[this._storageKey])
    } catch (err) {
      return undefined
    }
  }

  _put(newState) {
    global.localStorage[this._storageKey] = JSON.stringify(newState)
    this.emit('update', newState)
  }

}

module.exports = LocalStorageStore
