const express = require('express')
const createBundle = require('./util').createBundle
const serveBundle = require('./util').serveBundle

module.exports = createMetamascaraServer


function createMetamascaraServer(){

  // start bundlers
  const metamascaraBundle = createBundle('./src/mascara.js')
  const proxyBundle = createBundle('./src/proxy.js')
  const uiBundle = createBundle('./src/popup.js')
  const backgroundBuild = createBundle('./src/background.js')

  // serve bundles
  const server = express()
  // ui window
  serveBundle(server, '/ui.js', uiBundle)
  server.use(express.static(__dirname+'/../ui/'))
  server.use(express.static(__dirname+'/../../dist/chrome'))
  // metamascara
  serveBundle(server, '/metamascara.js', metamascaraBundle)
  // proxy
  serveBundle(server, '/proxy/proxy.js', proxyBundle)
  server.use('/proxy/', express.static(__dirname+'/../proxy'))
  // background
  serveBundle(server, '/background.js', backgroundBuild)

  return server

}
