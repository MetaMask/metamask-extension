const Dnode = require('dnode')
const inherits = require('util').inherits

module.exports = {
  HostStore: HostStore,
  RemoteStore: RemoteStore,
}

function BaseStore (initState) {
  this._state = initState || {}
  this._subs = []
}

BaseStore.prototype.set = function (key, value) {
  throw Error('Not implemented.')
}

BaseStore.prototype.get = function (key) {
  return this._state[key]
}

BaseStore.prototype.subscribe = function (fn) {
  this._subs.push(fn)
  var unsubscribe = this.unsubscribe.bind(this, fn)
  return unsubscribe
}

BaseStore.prototype.unsubscribe = function (fn) {
  var index = this._subs.indexOf(fn)
  if (index !== -1) this._subs.splice(index, 1)
}

BaseStore.prototype._emitUpdates = function (state) {
  this._subs.forEach(function (handler) {
    handler(state)
  })
}

//
// host
//

inherits(HostStore, BaseStore)
function HostStore (initState, opts) {
  BaseStore.call(this, initState)
}

HostStore.prototype.set = function (key, value) {
  this._state[key] = value
  process.nextTick(this._emitUpdates.bind(this, this._state))
}

HostStore.prototype.createStream = function () {
  var dnode = Dnode({
    // update: this._didUpdate.bind(this),
  })
  dnode.on('remote', this._didConnect.bind(this))
  return dnode
}

HostStore.prototype._didConnect = function (remote) {
  this.subscribe(function (state) {
    remote.update(state)
  })
  remote.update(this._state)
}

//
// remote
//

inherits(RemoteStore, BaseStore)
function RemoteStore (initState, opts) {
  BaseStore.call(this, initState)
  this._remote = null
}

RemoteStore.prototype.set = function (key, value) {
  this._remote.set(key, value)
}

RemoteStore.prototype.createStream = function () {
  var dnode = Dnode({
    update: this._didUpdate.bind(this),
  })
  dnode.once('remote', this._didConnect.bind(this))
  return dnode
}

RemoteStore.prototype._didConnect = function (remote) {
  this._remote = remote
}

RemoteStore.prototype._didUpdate = function (state) {
  this._state = state
  this._emitUpdates(state)
}
