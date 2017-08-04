const fs = require('fs')
const path = require('path')
const browserify = require('browserify')
const tests = fs.readdirSync(path.join(__dirname, 'lib'))
const bundlePath = path.join(__dirname, 'bundle.js')

const b = browserify()

try {
  const writeStream = fs.createWriteStream(bundlePath)

  tests.forEach(function (fileName) {
    b.add(path.join(__dirname, 'lib', fileName))
  })

  b.bundle().pipe(writeStream)
} catch (err) {
  throw new Error('Integration tests build failure - ' + err.stack)
}

