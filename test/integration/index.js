const fs = require('fs')
const path = require('path')
const pump = require('pump')
const browserify = require('browserify')
const tests = fs.readdirSync(path.join(__dirname, 'lib'))
const bundlePath = path.join(__dirname, 'bundle.js')

const b = browserify()

const writeStream = fs.createWriteStream(bundlePath)

tests.forEach(function (fileName) {
  const filePath = path.join(__dirname, 'lib', fileName)
  console.log(`bundling test "${filePath}"`)
  b.add(filePath)
})

pump(
  b.bundle(),
  writeStream,
  (err) => {
    if (err) throw err
    console.log(`Integration test build completed: "${bundlePath}"`)
    process.exit(0)
  }
)
