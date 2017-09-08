const Through = require('through2')
const endOfStream = require('end-of-stream')
const ObjectMultiplex = require('obj-multiplex')
const pump = require('pump')

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
  const mux = new ObjectMultiplex()
  pump(
    connectionStream,
    mux,
    connectionStream,
    (err) => {
      if (err) console.error(err)
    }
  )
  return mux
}
