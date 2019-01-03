const createParentStream = require('iframe-stream').ParentStream
const SwController = require('sw-controller')
const SwStream = require('sw-stream/lib/sw-stream.js')

const keepAliveDelay = Math.floor(Math.random() * (30000 - 1000)) + 1000
const background = new SwController({
  fileName: '../background.js',
  keepAlive: true,
  keepAliveInterval: 30000,
  keepAliveDelay,
})

const pageStream = createParentStream()
background.on('ready', () => {
  const swStream = SwStream({
    serviceWorker: background.getWorker(),
    context: 'dapp',
  })
  pageStream.pipe(swStream).pipe(pageStream)

})
background.on('updatefound', () => window.location.reload())

background.on('error', console.error)
background.startWorker()
