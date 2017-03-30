const ParentStream = require('iframe-stream').ParentStream
const SWcontroller = require('./sw-controller')
const SwStream = require('sw-stream/lib/sw-stream.js')
const SetupUntrustedComunication = ('./lib/setup-untrusted-connection.js')
const background = new SWcontroller({
  fileName: '/popup/sw-build.js',
})

const pageStream = new ParentStream()
background.on('ready', (_) => {
  // var inpageProvider = new MetamaskInpageProvider(SwStream(background.controller))
  let swStream = SwStream({
    serviceWorker: background.controller,
    context: 'dapp',
  })
  pageStream.pipe(swStream).pipe(pageStream)

})

background.on('error', console.error)
background.startWorker()
