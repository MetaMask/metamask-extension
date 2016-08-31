const express = require('express')
const browserify = require('browserify')
const watchify = require('watchify')
const babelify = require('babelify')
const path = require('path')

const zeroBundle = createBundle('./index.js')
const controllerBundle = createBundle('./controller.js')
const appBundle = createBundle('./example/index.js')

//
// Iframe Server
//

const iframeServer = express()

// serve controller bundle
iframeServer.get('/controller.js', function(req, res){
  res.send(controllerBundle.latest)
})

// serve static
iframeServer.use(express.static('./server'))

iframeServer.listen('9001')


//
// Dapp Server
//

const dappServer = express()


// serve metamask-lib bundle
dappServer.get('/zero.js', function(req, res){
  res.send(zeroBundle.latest)
})

// serve dapp bundle
dappServer.get('/app.js', function(req, res){
  res.send(appBundle.latest)
})

// serve static
dappServer.use(express.static('./example'))

const dappPort = '9002'
dappServer.listen(dappPort)
console.log(`Dapp listening on port ${dappPort}`)

function createBundle(entryPoint){

  var bundleContainer = {}

  var bundler = browserify({
    entries: [entryPoint],
    cache: {},
    packageCache: {},
    plugin: [watchify],
  })

  // global transpile
  var bablePreset = path.resolve(__dirname, '../node_modules/babel-preset-es2015')

  bundler.transform(babelify, {
    global: true,
    presets: [bablePreset],
  })


  bundler.on('update', bundle)
  bundle()

  return bundleContainer

  function bundle() {
    bundler.bundle(function(err, result){
      if (err) throw err
      console.log(`Bundle updated! (${entryPoint})`)
      bundleContainer.latest = result.toString()
    })
  }

}
