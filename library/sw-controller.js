const EventEmitter = require('events')

module.exports = class serviceWorkerController extends EventEmitter{
  constructor (opts) {
    super()
    this.fileName = opts.fileName
    this.registerOpts = opts.registerOpts
    this.serviceWorker = navigator.serviceWorker
  }


  startWorker () {
    // check to see if their is a preregistered service worker
    if (!this.serviceWorker.controller) {
      return Promise.resolve(this.registerWorker())
    } else {
      return Promise.resolve(this.serviceWorker.ready)
    }
  }

  registerWorker () {
    return this.serviceWorker.register(this.fileName, this.registerOpts)
    .then(sw => {
      return sw
    })
  }

  syncSW (registeredSW) {
    return registeredSW.sync.register('sync')
    .then(() => {
      console.log('sync')
    })
  }

  sendMessage (message) {
    const self = this
    return new Promise((resolve, reject) => {
       var messageChannel = new MessageChannel()
       messageChannel.port1.onmessage = (event) => {
         if (event.data.err) {
           reject(event.data.error)
         } else {
           resolve(event.data.data)
         }
       }
      self.serviceWorker.controller.postMessage(message, [messageChannel.port2])
    })
  }
}
