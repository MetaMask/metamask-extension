const Duplex = require('readable-stream').Duplex
const inherits = require('util').inherits

module.exports = PortDuplexStream


inherits(PortDuplexStream, Duplex)

function PortDuplexStream(port){
  Duplex.call(this, {
    objectMode: true,
  })
  this._port = port
  port.onMessage.addListener(this._onMessage.bind(this))
  port.onDisconnect.addListener(this._onDisconnect.bind(this))
}

// private

PortDuplexStream.prototype._onMessage = function(msg){
  // console.log('PortDuplexStream - saw message', msg)
  this.push(msg)
}

PortDuplexStream.prototype._onDisconnect = function(msg){
  // console.log('PortDuplexStream - saw message', msg)
  try {
    this.end()
  } catch(err){
    this.emit('error', err)
  }
}

// stream plumbing

PortDuplexStream.prototype._read = noop

PortDuplexStream.prototype._write = function(msg, encoding, cb){
  // console.log('PortDuplexStream - sent message', msg)
  this._port.postMessage(msg)
  cb()
}

// util

function noop(){}