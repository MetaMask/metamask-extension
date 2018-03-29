const path = require('path')
const express = require('express')
const createBundle = require('./util').createBundle
const serveBundle = require('./util').serveBundle
const compression = require('compression')

module.exports = createMetamascaraServer


function createMetamascaraServer () {

  // start bundlers
  const metamascaraBundle = createBundle(path.join(__dirname, '/../src/mascara.js'))
  const proxyBundle = createBundle(path.join(__dirname, '/../src/proxy.js'))
  const uiBundle = createBundle(path.join(__dirname, '/../src/ui.js'))
  const backgroundBuild = createBundle(path.join(__dirname, '/../src/background.js'))

  // setup server
  const server = express()
  server.use(compression())

  // serve bundles
  serveBundle(server, '/metamascara.js', metamascaraBundle)
  serveBundle(server, '/scripts/ui.js', uiBundle)
  serveBundle(server, '/scripts/proxy.js', proxyBundle)
  serveBundle(server, '/scripts/background.js', backgroundBuild)

  // serve assets
  server.use(express.static(path.join(__dirname, '/../ui/'), { setHeaders: (res) => res.set('X-Frame-Options', 'DENY') }))
  server.use(express.static(path.join(__dirname, '/../../dist/mascara')))
  server.use(express.static(path.join(__dirname, '/../proxy')))

  return server

}
