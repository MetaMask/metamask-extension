const fs = require('fs')
const path = require('path')

const cssFiles = {
  'widget': fs.readFileSync(path.join(__dirname, '/app/widget/index.css'), 'utf8'),
}

function bundleCss () {
  const cssBundle = Object.keys(cssFiles).reduce((bundle, fileName) => {
    const fileContent = cssFiles[fileName]
    let output = String()

    output += '/*========== ' + fileName + ' ==========*/\n\n'
    output += fileContent
    output += '\n\n'

    return bundle + output
  }, String())

  return cssBundle
}

module.exports = bundleCss
