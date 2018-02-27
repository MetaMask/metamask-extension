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

  // serve bundles
  const server = express()
  server.use(compression())

  // ui window
  serveBundle(server, '/ui.js', uiBundle)
  server.use(express.static(path.join(__dirname, '/../ui/'), { setHeaders: (res) => res.set('X-Frame-Options', 'DENY') }))
  server.use(express.static(path.join(__dirname, '/../../dist/chrome')))
  // metamascara
  serveBundle(server, '/metamascara.js', metamascaraBundle)
  // proxy
  serveBundle(server, '/proxy/proxy.js', proxyBundle)
  server.use('/proxy/', express.static(path.join(__dirname, '/../proxy')))
  // background
  serveBundle(server, '/background.js', backgroundBuild)

  return server

}
