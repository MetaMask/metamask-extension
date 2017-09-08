const Duplex = require('readable-stream').Duplex
const inherits = require('util').inherits
const noop = function(){}

module.exports = PortDuplexStream

inherits(PortDuplexStream, Duplex)

function PortDuplexStream (port) {
  Duplex.call(this, {
    objectMode: true,
  })
  this._port = port
  port.onMessage.addListener(this._onMessage.bind(this))
  port.onDisconnect.addListener(this._onDisconnect.bind(this))
}

// private

PortDuplexStream.prototype._onMessage = function (msg) {
  if (Buffer.isBuffer(msg)) {
    delete msg._isBuffer
    var data = new Buffer(msg)
    this.push(data)
  } else {
    this.push(msg)
  }
}

PortDuplexStream.prototype._onDisconnect = function () {
  this.destroy()
}

// stream plumbing

PortDuplexStream.prototype._read = noop

PortDuplexStream.prototype._write = function (msg, encoding, cb) {
  try {
    if (Buffer.isBuffer(msg)) {
      var data = msg.toJSON()
      data._isBuffer = true
      this._port.postMessage(data)
    } else {
      this._port.postMessage(msg)
    }
  } catch (err) {
    return cb(new Error('PortDuplexStream - disconnected'))
  }
  cb()
}
