const Duplex = require('readable-stream').Duplex
const inherits = require('util').inherits

module.exports = StreamProvider


inherits(StreamProvider, Duplex)

function StreamProvider(){
  Duplex.call(this, {
    objectMode: true,
  })

  this._payloads = {}
}

// public

StreamProvider.prototype.send = function(payload){
  throw new Error('StreamProvider - does not support synchronous RPC calls. called: "'+payload.method+'"')
}

StreamProvider.prototype.sendAsync = function(payload, callback){
  // console.log('StreamProvider - sending payload', payload)
  var id = payload.id
  if (Array.isArray(payload)) {
    id = 'batch'+payload[0].id
  }
  this._payloads[id] = [payload, callback]
  // console.log('payload for plugin:', payload)
  this.push(payload)
}

StreamProvider.prototype.isConnected = function(){
  return true
}

// private

StreamProvider.prototype._onResponse = function(response){
  // console.log('StreamProvider - got response', payload)
  var id = response.id
  if (Array.isArray(response)) {
    id = 'batch'+response[0].id
  }
  var data = this._payloads[id]
  if (!data) throw new Error('StreamProvider - Unknown response id')
  delete this._payloads[id]
  var payload = data[0]
  var callback = data[1]

  // logging
  var res = Array.isArray(response) ? response : [response]
  // ;(Array.isArray(payload) ? payload : [payload]).forEach(function(payload, index){
  //   console.log('plugin response:', payload.id, payload.method, payload.params, '->', res[index].result)
  // })

  callback(null, response)
}

// stream plumbing

StreamProvider.prototype._read = noop

StreamProvider.prototype._write = function(msg, encoding, cb){
  this._onResponse(msg)
  cb()
}

// util

function noop(){}