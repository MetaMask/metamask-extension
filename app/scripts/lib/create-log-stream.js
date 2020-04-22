const through2 = require('through2')

function createLogStream (name = 'untitled') {
  return through2({ objectMode: true }, function (chunk, enc, cb) {
    console.log(`Stream ${name} logged: ${JSON.stringify(chunk)}`)
    this.push(chunk)
    cb()
  })
}

module.exports = createLogStream
