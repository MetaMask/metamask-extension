const Through = require('through2')


module.exports = {
  jsonParseStream: jsonParseStream,
  jsonStringifyStream: jsonStringifyStream,
}

function jsonParseStream(){
  return Through.obj(function(serialized, encoding, cb){
    this.push(JSON.parse(serialized))
    cb()
  })
}

function jsonStringifyStream(){
  return Through.obj(function(obj, encoding, cb){
    this.push(JSON.stringify(obj))
    cb()
  })
}
