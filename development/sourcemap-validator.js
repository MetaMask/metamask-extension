const fs = require('fs')
const { SourceMapConsumer } = require('source-map')
const path = require('path')
const pify = require('pify')
const fsAsync = pify(fs)

//
// Utility to help check if sourcemaps are working
//
// searches `dist/chrome/inpage.js` for "new Error" statements
// and prints their source lines using the sourcemaps.
// if not working it may error or print minified garbage
//

start().catch(console.error)


async function start () {
  const targetFiles = [`inpage.js`, `contentscript.js`, `ui.js`, `background.js`]
  for (const buildName of targetFiles) {
    await validateSourcemapForFile({ buildName })
  }
}

async function validateSourcemapForFile ({ buildName }) {
  console.log(`build "${buildName}"`)
  const platform = `chrome`
  // load build and sourcemaps
  let rawBuild
  try {
    const filePath = path.join(__dirname, `/../dist/${platform}/`, `${buildName}`)
    rawBuild = await fsAsync.readFile(filePath, 'utf8')
  } catch (err) {}
  if (!rawBuild) {
    throw new Error(`SourcemapValidator - failed to load source file for "${buildName}"`)
  }
  // attempt to load in dist mode
  let rawSourceMap
  try {
    const filePath = path.join(__dirname, `/../dist/sourcemaps/`, `${buildName}.map`)
    rawSourceMap = await fsAsync.readFile(filePath, 'utf8')
  } catch (err) {}
  // attempt to load in dev mode
  try {
    const filePath = path.join(__dirname, `/../dist/${platform}/`, `${buildName}.map`)
    rawSourceMap = await fsAsync.readFile(filePath, 'utf8')
  } catch (err) {}
  if (!rawSourceMap) {
    throw new Error(`SourcemapValidator - failed to load sourcemaps for "${buildName}"`)
  }

  const consumer = await new SourceMapConsumer(rawSourceMap)

  const hasContentsOfAllSources = consumer.hasContentsOfAllSources()
  if (!hasContentsOfAllSources) console.warn('SourcemapValidator - missing content of some sources...')

  console.log(`  sampling from ${consumer.sources.length} files`)
  let sampleCount = 0

  const buildLines = rawBuild.split('\n')
  const targetString = 'new Error'
  // const targetString = 'null'
  const matchesPerLine = buildLines.map(line => indicesOf(targetString, line))
  matchesPerLine.forEach((matchIndices, lineIndex) => {
    matchIndices.forEach((matchColumn) => {
      sampleCount++
      const position = { line: lineIndex + 1, column: matchColumn }
      const result = consumer.originalPositionFor(position)
      // warn if source content is missing
      if (!result.source) {
        console.warn(`!! missing source for position: ${JSON.stringify(position)}`)
        // const buildLine = buildLines[position.line - 1]
        console.warn(`   origin in build:`)
        console.warn(`   ${buildLines[position.line - 2]}`)
        console.warn(`-> ${buildLines[position.line - 1]}`)
        console.warn(`   ${buildLines[position.line - 0]}`)
        return
      }
      const sourceContent = consumer.sourceContentFor(result.source)
      const sourceLines = sourceContent.split('\n')
      const line = sourceLines[result.line - 1]
      // this sometimes includes the whole line though we tried to match somewhere in the middle
      const portion = line.slice(result.column)
      const isMaybeValid = portion.includes(targetString)
      if (!isMaybeValid) {
        console.error('Sourcemap seems invalid:')
        console.log(`\n========================== ${result.source} ====================================\n`)
        console.log(line)
        console.log(`\n==============================================================================\n`)
      }
    })
  })
  console.log(`  checked ${sampleCount} samples`)
}

function indicesOf (substring, string) {
  var a = []
  var i = -1
  while ((i = string.indexOf(substring, i + 1)) >= 0) a.push(i)
  return a
}
