const path = require('path')
const { removeFencedCode } = require('../transforms/remove-fenced-code.js')

module.exports = (moduleRecord) => {
  // skip dependencies
  if (moduleRecord.file.includes('node_modules')) return
  // only deal with known extensions
  if (!['.js', '.cjs', '.mjs'].includes(path.extname(moduleRecord.file))) {
    return
  }
  // attempt transformation
  const [fileContent, didModify] = removeFencedCode(moduleRecord.file, 'main', moduleRecord.source)
  if (didModify) {
    moduleRecord.source = fileContent
  }
}