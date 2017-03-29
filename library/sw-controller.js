const EventEmitter = require('events')

module.exports = class ClientSideServiceWorker extends EventEmitter{
  constructor (opts) {
    super()
    this.fileName = opts.fileName
    this.startDelay = opts.startDelay

    this.serviceWorkerApi = navigator.serviceWorker
    this.serviceWorkerApi.onmessage = (messageEvent) => this.emit('message', messageEvent)
    this.serviceWorkerApi.onerror = (err) => this.emit('error', err)
    this.on('message', (messageEvent) => {debugger})
    if (opts.initStart) this.startWorker()
  }

  get controller () {
    return  this.sw || this.serviceWorkerApi.controller
  }


  startWorker () {
    return this.registerWorker()
    .then((sw) => {
      this.sw = sw
      this.sw.onerror = (err) => this.emit('error', err)
      this.sw = sw
      this.emit('ready', this.sw)
    })
    .catch((err) => this.emit('error', err))
  }

  registerWorker () {
    return this.serviceWorkerApi.register(this.fileName)
    .then((registerdWorker) => {
      return new Promise((resolve, reject) => {
        let timeOutId = setTimeout(() => {
          if (this.serviceWorkerApi.controller) return resolve(this.serviceWorkerApi.controller)
          if (registerdWorker.active) return resolve(registerdWorker.active)
          return reject(new Error('ClientSideServiceWorker: No controller found and onupdatefound timed out'))
        }, this.startDelay || 1000 )

        registerdWorker.onupdatefound =  (event) => {
          this.emit('updatefound')
          registerdWorker.update()
        }
      })
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
      this.controller.postMessage(message, [messageChannel.port2])
    })
  }
}
