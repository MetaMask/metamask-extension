const fs = require('fs')
const path = require('path')

module.exports = bundleCss

var cssFiles = {
  'index.css': fs.readFileSync(path.join(__dirname, '/app/css/output/index.css'), 'utf8'),
  'first-time.css': fs.readFileSync(path.join(__dirname, '../mascara/src/app/first-time/index.css'), 'utf8'),
  // 'react-tooltip.css': fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'react-tooltip', 'dist', 'style.css'), 'utf8'),
  'react-css': fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'react-select', 'dist', 'react-select.css'), 'utf8'),
}

function bundleCss () {
  var cssBundle = Object.keys(cssFiles).reduce(function (bundle, fileName) {
    var fileContent = cssFiles[fileName]
    var output = String()

    output += '/*========== ' + fileName + ' ==========*/\n\n'
    output += fileContent
    output += '\n\n'

    return bundle + output
  }, String())

  return cssBundle
}
