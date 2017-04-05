const ParentStream = require('iframe-stream').ParentStream
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')
const SetupUntrustedComunication = ('./lib/setup-untrusted-connection.js')

const background = new SWcontroller({
  fileName: '/background.js',
})

const pageStream = new ParentStream()
background.on('ready', (_) => {
  let swStream = SwStream({
    serviceWorker: background.controller,
    context: 'dapp',
  })
  pageStream.pipe(swStream).pipe(pageStream)

})

background.on('error', console.error)
background.startWorker()
