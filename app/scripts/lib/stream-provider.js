const Duplex = require('readable-stream').Duplex
const inherits = require('util').inherits

module.exports = StreamProvider


inherits(StreamProvider, Duplex)

function StreamProvider(){
  Duplex.call(this, {
    objectMode: true,
  })

  this._handlers = {}
}

// public

StreamProvider.prototype.send = function(payload){
  throw new Error('StreamProvider - does not support synchronous RPC calls')
}

StreamProvider.prototype.sendAsync = function(payload, callback){
//   console.log('StreamProvider - sending payload', payload)
  this._handlers[payload.id] = callback
  this.push(payload)
}

// private

StreamProvider.prototype._onResponse = function(payload){
//   console.log('StreamProvider - got response', payload)
  var callback = this._handlers[payload.id]
  if (!callback) throw new Error('StreamProvider - Unknown response id')
  delete this._handlers[payload.id]
  callback(null, payload)
}

// stream plumbing

StreamProvider.prototype._read = noop

StreamProvider.prototype._write = function(msg, encoding, cb){
  this._onResponse(msg)
  cb()
}

// util

function noop(){}