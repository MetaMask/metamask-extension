var fs = require('fs')
var path = require('path')
var browserify = require('browserify')
var tests = fs.readdirSync(path.join(__dirname, 'lib'))
var bundlePath = path.join(__dirname, 'test-bundle.js')
var b = browserify()

// Remove old bundle
try {
  fs.unlinkSync(bundlePath)
} catch (e) {
  console.error(e)
}

var writeStream = fs.createWriteStream(bundlePath)

tests.forEach(function (fileName) {
  b.add(path.join(__dirname, 'lib', fileName))
})

b.bundle().pipe(writeStream)

