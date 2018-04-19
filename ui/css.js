const fs = require('fs')
const path = require('path')

module.exports = bundleCss

const cssFiles = {
  'index.css': fs.readFileSync(path.join(__dirname, '/app/css/output/index.css'), 'utf8'),
  'first-time.css': fs.readFileSync(path.join(__dirname, '../mascara/src/app/first-time/index.css'), 'utf8'),
  'react-tooltip-component.css': fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'react-tooltip-component', 'dist', 'react-tooltip-component.css'), 'utf8'),
  'react-css': fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'react-select', 'dist', 'react-select.css'), 'utf8'),
}

function bundleCss () {
  const cssBundle = Object.keys(cssFiles).reduce(function (bundle, fileName) {
    const fileContent = cssFiles[fileName]
    let output = String()

    output += '/*========== ' + fileName + ' ==========*/\n\n'
    output += fileContent
    output += '\n\n'

    return bundle + output
  }, String())

  return cssBundle
}
