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
  if (Buffer.isBuffer(msg)) {
    delete msg._isBuffer
    var data = new Buffer(msg)
    // console.log('PortDuplexStream - saw message as buffer', data)
    this.push(data)
  } else {
    // console.log('PortDuplexStream - saw message', msg)
    this.push(msg)
  }
}

PortDuplexStream.prototype._onDisconnect = function(){
  try {
    // this.end()
    this.emit('close')
  } catch(err){
    this.emit('error', err)
  }
}

// stream plumbing

PortDuplexStream.prototype._read = noop

PortDuplexStream.prototype._write = function(msg, encoding, cb){
  try {
    if (Buffer.isBuffer(msg)) {
      var data = msg.toJSON()
      data._isBuffer = true
      // console.log('PortDuplexStream - sent message as buffer', data)
      this._port.postMessage(data)
    } else {
      // console.log('PortDuplexStream - sent message', msg)
      this._port.postMessage(msg)
    }
    cb()
  } catch(err){
    console.error(err)
    // this.emit('error', err)
    cb(new Error('PortDuplexStream - disconnected'))
  }
}

// util

function noop(){}