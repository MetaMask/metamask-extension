const EventEmitter = require('events').EventEmitter

class ObservableStore extends EventEmitter {

  constructor (initialState) {
    super()
    this._state = initialState
  }

  get () {
    return this._state
  }

  put (newState) {
    this._state = newState
    this.emit('update', newState)
  }

  subscribe (handler) {
    this.on('update', handler)
  }

  unsubscribe (handler) {
    this.removeListener('update', handler)
  }

}

module.exports = ObservableStore
