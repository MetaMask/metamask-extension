const path = require('path')
const express = require('express')
const createBundle = require('./util').createBundle
const serveBundle = require('./util').serveBundle
const compression = require('compression')

module.exports = createMetamascaraServer


function createMetamascaraServer () {

  // setup server
  const server = express()
  server.use(compression())

  // serve assets
  server.use(express.static(path.join(__dirname, '/../ui/'), { setHeaders: (res) => res.set('X-Frame-Options', 'DENY') }))
  server.use(express.static(path.join(__dirname, '/../../dist/mascara')))
  server.use(express.static(path.join(__dirname, '/../proxy')))

  return server

}
