// const { makeBundle } = require('./bumble.js')
const { makeBundle } = require('./cm.js')
const { createWorkerTransform } = require('./worker-util.js')

main().catch(console.error)

async function main () {
  const { workerTransform, workerPool } = createWorkerTransform([
    './fenced-code.js',
    './babelify.js',
  ])
  try {
    const bundle = await makeBundle({
      entryFiles: [
        './app/scripts/ui.js',
        './app/scripts/background.js',
      ],
      projectDir: process.cwd(),
      transforms: [
        workerTransform,
        // require('./fenced-code.js'),
        // require('./babelify.js'),
        // // Inline `fs.readFileSync` files
        // brfs,
        // [envify(envVars), { global: true }]
        // minify (should happen here)
      ],
      builtinModules: require('./browserify-builtins.js')(),
      manualIgnore: [
        'react-devtools',
        'remote-redux-devtools',
      ],
    })
    console.log('done')
  } finally {
    workerPool.destroy()
  }
}