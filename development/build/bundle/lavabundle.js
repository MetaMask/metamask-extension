// loadModule
  // resolve
  // transform
  // parse for imports
  // generate
// tag/factor
// bundle

// sourcemaps, livereloading become an afterthought

// ideal: upfront and lazy

const fs = require('fs')
const path = require('path')
const resolve = require('browser-resolve');
const detective = require('detective');

const extensions = ['.js', '.ts', '.tsx']

main().catch(console.error)

async function main () {
  const transformer = await createTransformer({
    entryFiles: [
      './app/scripts/ui.js',
      './app/scripts/background.js',
    ],
    projectDir: process.cwd(),
    transforms: [
      require('./fenced-code.js'),
      require('./babelify.js'),
      // // Inline `fs.readFileSync` files
      // brfs,
      // [envify(envVars), { global: true }]
      // minify (should happen here)
    ],
    builtinModules: require('./browserify-builtins.js')(),
  })
}

async function createTransformer ({ entryFiles, projectDir, stringTransforms = [], transforms = [], builtinModules = {} }) {
  const moduleRecords = new Map()
  let resolveTime = 0
  let readTime = 0
  let transformTime = 0
  let parseTime = 0

  const entryRecords = await Promise.all(entryFiles.map(filename => {
    return loadModule(filename, projectDir)
  }))

  const visited = new Set()
  const queue = [...entryRecords]
  // for await (const moduleRecord of queue) {
  for (const moduleRecord of queue) {
    if (visited.has(moduleRecord.file)) continue
    visited.add(moduleRecord.file)
    const locationDir = path.dirname(moduleRecord.file)
    for (const importSpecifier of moduleRecord.detectedImports) {
      const childRecord = await loadModule(importSpecifier, locationDir)
      queue.push(childRecord)
      // const childRecordPromise = loadModule(importSpecifier, locationDir)
      // queue.push(childRecordPromise)
      // console.log('loaded', childRecord.file)
    }
  }
  console.log('done', visited.size, {
    resolveTime,
    readTime,
    transformTime,
    parseTime, 
  })

  async function loadModule (specifier, location) {
    const resolveStart = Date.now()
    // resolver taking about 23% of total build time
    // in @lavamoat/aa we found some memoization opportunities
    const resolved = resolve.sync(specifier, { basedir: location, extensions: ['.json', ...extensions] })
    resolveTime += Date.now() - resolveStart
    // check cache
    if (moduleRecords.has(resolved)) return moduleRecords.get(resolved)
    // check for builtin
    if (builtinModules[resolved] !== undefined) {
      return builtinModules[resolved]
    }
    // load from disk
    const readStart = Date.now()
    const source = fs.readFileSync(resolved, 'utf8')
    // const source = await fs.promises.readFile(resolved, 'utf8')
    readTime += Date.now() - readStart

    const moduleRecord = {
      file: resolved,
      source,
      detectedImports: null,
    };

    const transformStart = Date.now()
    for (const transformFn of transforms) {
      await transformFn(moduleRecord)
    }
    transformTime += Date.now() - transformStart

    const parseStart = Date.now()
    moduleRecord.detectedImports = detective(moduleRecord.source)
    parseTime += Date.now() - parseStart

    moduleRecords.set(resolved, moduleRecord)
    return moduleRecord
  }
}
