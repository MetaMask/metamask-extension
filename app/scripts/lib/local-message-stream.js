const Duplex = require('readable-stream').Duplex
const inherits = require('util').inherits

module.exports = LocalMessageDuplexStream


inherits(LocalMessageDuplexStream, Duplex)

function LocalMessageDuplexStream(opts){
  Duplex.call(this, {
    objectMode: true,
  })

  // this._origin = opts.origin
  this._name = opts.name
  this._target = opts.target

  // console.log('LocalMessageDuplexStream ('+this._name+') - initialized...')
  window.addEventListener('message', this._onMessage.bind(this), false)
}

// private

LocalMessageDuplexStream.prototype._onMessage = function(event){
  var msg = event.data
  // console.log('LocalMessageDuplexStream ('+this._name+') - heard message...')
  // validate message
  if (event.origin !== location.origin) return //console.log('LocalMessageDuplexStream ('+this._name+') - rejected - (event.origin !== location.origin) ')
  if (typeof msg !== 'object') return //console.log('LocalMessageDuplexStream ('+this._name+') - rejected - (typeof msg !== "object") ')
  if (msg.target !== this._name) return //console.log('LocalMessageDuplexStream ('+this._name+') - rejected - (msg.target !== this._name) ', msg.target, this._name)
  if (!msg.data) return //console.log('LocalMessageDuplexStream ('+this._name+') - rejected - (!msg.data) ')
  // console.log('LocalMessageDuplexStream ('+this._name+') - accepted', msg.data)
  // forward message
  this.push(msg.data)
}

// stream plumbing

LocalMessageDuplexStream.prototype._read = noop

LocalMessageDuplexStream.prototype._write = function(data, encoding, cb){
  // console.log('LocalMessageDuplexStream ('+this._name+') - sending message...')
  var message = {
    target: this._target,
    data: data,
  }
  window.postMessage(message, location.origin)
  cb()
}

// util

function noop(){}