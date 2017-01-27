const Through = require('through2')
const endOfStream = require('end-of-stream')
const ObjectMultiplex = require('./obj-multiplex')

module.exports = {
  jsonParseStream: jsonParseStream,
  jsonStringifyStream: jsonStringifyStream,
  setupMultiplex: setupMultiplex,
}

function jsonParseStream () {
  return Through.obj(function (serialized, encoding, cb) {
    this.push(JSON.parse(serialized))
    cb()
  })
}

function jsonStringifyStream () {
  return Through.obj(function (obj, encoding, cb) {
    this.push(JSON.stringify(obj))
    cb()
  })
}

function setupMultiplex (connectionStream) {
  var mx = ObjectMultiplex()
  connectionStream.pipe(mx).pipe(connectionStream)
  endOfStream(mx, function (err) {
    if (err) console.error(err)
  })
  endOfStream(connectionStream, function (err) {
    if (err) console.error(err)
    mx.destroy()
  })
  return mx
}
