const Dnode = require('dnode')
const ObservableStore = require('./index')
const endOfStream = require('end-of-stream')

//
// RemoteStore
//
// connects to a HostStore and receives its latest state 
//

class RemoteStore extends ObservableStore {

  constructor (initState, opts) {
    super(initState)
    this.opts = opts || {}
    this._remote = null
  }

  put (newState) {
    if (!this._remote) throw new Error('RemoteStore - "put" called before connection to HostStore')
    this._put(newState)
    this._remote.put(newState)
  }

  createStream () {
    const self = this
    const dnode = Dnode({
      put: (newState) => self._put(newState),
    })
    // listen for connection to remote
    dnode.once('remote', (remote) => {
      // setup connection lifecycle
      self._onConnect(remote)
      endOfStream(dnode, () => self._onDisconnect())
    })
    return dnode
  }

  _onConnect (remote) {
    this._remote = remote
    this.emit('connected')
  }

  _onDisconnect () {
    this._remote = null
    this.emit('disconnected')
  }

}

module.exports = RemoteStore