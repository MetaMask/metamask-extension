var fs = require('fs')
var path = require('path')
var browserify = require('browserify')
var tests = fs.readdirSync(path.join(__dirname, 'lib'))
var bundlePath = path.join(__dirname, 'bundle.js')

var b = browserify()

// Remove old bundle
try {
  // if (fs.existsSync(bundlePath)) {
  //   fs.unlinkSync(bundlePath)
  // }

  var writeStream = fs.createWriteStream(bundlePath)

  tests.forEach(function (fileName) {
    b.add(path.join(__dirname, 'lib', fileName))
  })

  b.bundle().pipe(writeStream)
} catch (err) {
  throw new Error('Integration tests build failure - ' + err.stack)
}

