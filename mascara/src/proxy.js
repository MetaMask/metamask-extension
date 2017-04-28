const ParentStream = require('iframe-stream').ParentStream
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')
const SetupUntrustedComunication = ('./lib/setup-untrusted-connection.js')

let intervalDelay =  Math.floor(Math.random() * (30000 - 1000)) + 1000
const background = new SWcontroller({
  fileName: '/background.js',
  letBeIdle: false,
  wakeUpInterval: 30000,
  intervalDelay,
})

const pageStream = new ParentStream()
background.on('ready', (_) => {
  let swStream = SwStream({
    serviceWorker: background.controller,
    context: 'dapp',
  })
  pageStream.pipe(swStream).pipe(pageStream)

})
background.on('updatefound', () => window.location.reload())

background.on('error', console.error)
background.startWorker()
