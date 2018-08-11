const fs = require('fs')
const { SourceMapConsumer } = require('source-map')
const path = require('path')
//
// Utility to help check if sourcemaps are working
//
// searches `dist/chrome/inpage.js` for "new Error" statements
// and prints their source lines using the sourcemaps.
// if not working it may error or print minified garbage
//

start()


async function start () {
  const rawBuild = fs.readFileSync(path.join(__dirname, '/../dist/chrome/', 'inpage.js')
  , 'utf8')
  const rawSourceMap = fs.readFileSync(path.join(__dirname, '/../dist/sourcemaps/', 'inpage.js.map'), 'utf8')
  const consumer = await new SourceMapConsumer(rawSourceMap)

  console.log('hasContentsOfAllSources:', consumer.hasContentsOfAllSources(), '\n')
  console.log('sources:')
  consumer.sources.map((sourcePath) => console.log(sourcePath))

  console.log('\nexamining "new Error" statements:\n')
  const sourceLines = rawBuild.split('\n')
  sourceLines.map(line => indicesOf('new Error', line))
  .forEach((errorIndices, lineIndex) => {
    // if (errorIndex === null) return console.log('line does not contain "new Error"')
    errorIndices.forEach((errorIndex) => {
      const position = { line: lineIndex + 1, column: errorIndex }
      const result = consumer.originalPositionFor(position)
      if (!result.source) return console.warn(`!! missing source for position: ${position}`)
      // filter out deps distributed minified without sourcemaps
      if (result.source === 'node_modules/browserify/node_modules/browser-pack/_prelude.js') return // minified mess
      if (result.source === 'node_modules/web3/dist/web3.min.js') return // minified mess
      const sourceContent = consumer.sourceContentFor(result.source)
      const sourceLines = sourceContent.split('\n')
      const line = sourceLines[result.line - 1]
      console.log(`\n========================== ${result.source} ====================================\n`)
      console.log(line)
      console.log(`\n==============================================================================\n`)
    })
  })
}

function indicesOf (substring, string) {
  var a = []
  var i = -1
  while ((i = string.indexOf(substring, i + 1)) >= 0) a.push(i)
  return a
}
