const express = require('express')
const path = require('path')
const createMetamascaraServer = require('../server/')
const createBundle = require('../server/util').createBundle
const serveBundle = require('../server/util').serveBundle
//
// Iframe Server
//

const mascaraServer = createMetamascaraServer()

// start the server
const mascaraPort = 9001
mascaraServer.listen(mascaraPort)
console.log(`Mascara service listening on port ${mascaraPort}`)


//
// Dapp Server
//

const dappServer = express()

// serve dapp bundle
serveBundle(dappServer, '/app.js', createBundle(require.resolve('./app.js')))
dappServer.use(express.static(path.join(__dirname, '/app/')))

// start the server
const dappPort = '9002'
dappServer.listen(dappPort)
console.log(`Dapp listening on port ${dappPort}`)
