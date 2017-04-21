// module.exports =
const EventEmitter = require('events')
module.exports = class IndexDbController extends EventEmitter {

  constructor (opts) {
    super()
    global.IDBTransaction = global.IDBTransaction || global.webkitIDBTransaction || global.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    global.IDBKeyRange = global.IDBKeyRange || global.webkitIDBKeyRange || global.msIDBKeyRange
    this.migrations = opts.migrations
    this.key = opts.key
    this.version = opts.version
    this.initialState = opts.initialState
  }

  // Opens the database connection and returns a promise
  open (version = this.version) {
    return this.get('dataStore')
    .then((data) => {
      if (!data) {
        return this._add('dataStore', this.initialState)
          .then(() => this.get('dataStore'))
          .then((versionedData) => Promise.resolve(versionedData))
      }
      return Promise.resolve(data)
    })
  }


  get (key = 'dataStore') {
    return this._request('get', key)
  }
  put (state) {
    return this._request('put', state, 'dataStore')
  }

  _add (key = 'dataStore', objStore) {
    return this._request('add', objStore, key)
  }

  _request (call, ...args) {
    return new Promise((resolve, reject) => {
      const self = this
      const dbOpenRequest = global.indexedDB.open(this.key, this.version)

      dbOpenRequest.onupgradeneeded = (event) => {
        this.db = event.target.result
        this.db.createObjectStore('dataStore')
      }

      dbOpenRequest.onsuccess = (event) => {
        this.db = dbOpenRequest.result
        this.emit('success')
        const dbTransaction = this.db.transaction('dataStore', 'readwrite')
        const request = dbTransaction.objectStore('dataStore')
        const objRequest = request[call](...args)
        objRequest.onsuccess = (event) => {
          return resolve(objRequest.result)
        }
        objRequest.onerror = (err) => {
          return reject(err.message)
        }
        dbTransaction.oncomplete = (event) => {
          this.emit('complete')
        }
      }

      dbOpenRequest.onerror = (event) => {
        return reject(event)
      }
    })
  }
}
