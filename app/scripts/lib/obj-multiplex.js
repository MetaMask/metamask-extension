const through = require('through2')

module.exports = ObjectMultiplex

function ObjectMultiplex (opts) {
  opts = opts || {}
  // create multiplexer
  var mx = through.obj(function (chunk, enc, cb) {
    var name = chunk.name
    var data = chunk.data
    var substream = mx.streams[name]
    if (!substream) {
      console.warn(`orphaned data for stream "${name}"`)
    } else {
      if (substream.push) substream.push(data)
    }
    return cb()
  })
  mx.streams = {}
  // create substreams
  mx.createStream = function (name) {
    var substream = mx.streams[name] = through.obj(function (chunk, enc, cb) {
      mx.push({
        name: name,
        data: chunk,
      })
      return cb()
    })
    mx.on('end', function () {
      return substream.emit('end')
    })
    if (opts.error) {
      mx.on('error', function () {
        return substream.emit('error')
      })
    }
    return substream
  }
  // ignore streams (dont display orphaned data warning)
  mx.ignoreStream = function (name) {
    mx.streams[name] = true
  }
  return mx
}
