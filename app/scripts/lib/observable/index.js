const EventEmitter = require('events').EventEmitter

class ObservableStore extends EventEmitter {

  constructor (initialState) {
    super()
    this._state = initialState
  }

  // wrapper around internal get
  get () {
    return this._state
  }
  
  // wrapper around internal put
  put (newState) {
    this._put(newState)
  }

  // subscribe to changes
  subscribe (handler) {
    this.on('update', handler)
  }

  // unsubscribe to changes
  unsubscribe (handler) {
    this.removeListener('update', handler)
  }

  //
  // private
  //

  _put (newState) {
    this._state = newState
    this.emit('update', newState)
  }

}

module.exports = ObservableStore
