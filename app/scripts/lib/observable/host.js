const Dnode = require('dnode')
const ObservableStore = require('./index')
const endOfStream = require('end-of-stream')

//
// HostStore
//
// plays host to many RemoteStores and sends its state over a stream
//

class HostStore extends ObservableStore {

  constructor (initState, opts) {
    super(initState)
    this._opts = opts || {}
  }

  createStream () {
    const self = this
    // setup remotely exposed api
    let remoteApi = {}
    if (!self._opts.readOnly) {
      remoteApi.put = (newState) => self.put(newState)
    }
    // listen for connection to remote
    const dnode = Dnode(remoteApi)
    dnode.on('remote', (remote) => {
      // setup update subscription lifecycle
      const updateHandler = (state) => remote.put(state)
      self._onConnect(updateHandler)
      endOfStream(dnode, () => self._onDisconnect(updateHandler))
    })
    return dnode
  }

  _onConnect (updateHandler) {
    // subscribe to updates
    this.subscribe(updateHandler)
    // send state immediately
    updateHandler(this.get())
  }

  _onDisconnect (updateHandler) {
    // unsubscribe to updates
    this.unsubscribe(updateHandler)
  }

}

module.exports = HostStore
