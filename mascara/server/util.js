const browserify = require('browserify')
const watchify = require('watchify')

module.exports = {
  serveBundle,
  createBundle,
}


function serveBundle(server, path, bundle){
  server.get(path, function(req, res){
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8')
    res.send(bundle.latest)
  })
}

function createBundle(entryPoint){

  var bundleContainer = {}

  var bundler = browserify({
    entries: [entryPoint],
    cache: {},
    packageCache: {},
    plugin: [watchify],
  })

  bundler.on('update', bundle)
  bundle()

  return bundleContainer

  function bundle() {
    bundler.bundle(function(err, result){
      if (err) {
        console.log(`Bundle failed! (${entryPoint})`)
        console.error(err)
        return
      }
      console.log(`Bundle updated! (${entryPoint})`)
      bundleContainer.latest = result.toString()
    })
  }

}
