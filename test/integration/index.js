var fs = require('fs')
var path = require('path')
var browserify = require('browserify')
var tests = fs.readdirSync(path.join(__dirname, 'lib'))
var bundlePath = path.join(__dirname, 'bundle.js')

var b = browserify()

// Remove old bundle
try {
  fs.unlinkSync(bundlePath)

  var writeStream = fs.createWriteStream(bundlePath)

  tests.forEach(function (fileName) {
    b.add(path.join(__dirname, 'lib', fileName))
  })

  b.bundle().pipe(writeStream)
} catch (e) {
  console.error('Integration build failure', e)
}

