const EventEmitter = require('events')
const IDB = require('idb-global')
const KEY = 'metamask-test-config'
module.exports = class Helper extends EventEmitter {

  tryToCleanContext () {
    this.unregister()
    .then(() => this.clearDb())
    .then(() => super.emit('complete'))
    .catch((err) => {
      if (err) {
        super.emit('complete')
      }
    })
  }

  unregister () {
    return global.navigator.serviceWorker.getRegistration()
    .then((registration) => {
      if (registration) {
 return registration.unregister()
      .then((b) => b ? Promise.resolve() : Promise.reject())
} else return Promise.resolve()
    })
  }
  clearDb () {
    return new Promise((resolve, reject) => {
      const deleteRequest = global.indexDB.deleteDatabase(KEY)
      deleteRequest.addEventListener('success', resolve)
      deleteRequest.addEventListener('error', reject)
    })

  }
  mockState (state) {
    const db = new IDB({
      version: 2,
      key: KEY,
      initialState: state,
    })
    return db.open()
  }
}
