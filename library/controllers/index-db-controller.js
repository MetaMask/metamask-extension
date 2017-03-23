const EventEmitter = require('events')
module.exports = class IndexDbController extends EventEmitter {

  constructor (opts) {
    super()
    this.migrations = opts.migrations
    this.key = opts.key
    this.dbObject = global.indexedDB
    this.IDBTransaction = global.IDBTransaction || global.webkitIDBTransaction || global.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    this.IDBKeyRange = global.IDBKeyRange || global.webkitIDBKeyRange || global.msIDBKeyRange;
    this.version = opts.version
    this.logging = opts.logging
    this.initialState = opts.initialState
    if (this.logging) this.on('log', logger)
  }

  // Opens the database connection and returns a promise
  open (version = this.version) {
    return new Promise((resolve, reject) => {
      const dbOpenRequest = this.dbObject.open(this.key, version)
      dbOpenRequest.onerror = (event) => {
        return reject(event)
      }
      dbOpenRequest.onsuccess = (event) => {
        this.db = dbOpenRequest.result
        if (!this.db.objectStoreNames.length) {
          Object.keys(this.initialState).forEach((key) => {
            this._add(key, this.initialState[key])
          })
        }
        this.emit('success')
        resolve(this.db)
      }
      dbOpenRequest.onupgradeneeded = (event) => {
        // if (this.migrators)
        this.db = event.target.result
        this.migrate()
      }
    })
  }

  requestObjectStore (key, type = 'readonly') {
    return new Promise((resolve, reject) => {
      const dbReadWrite = this.db.transaction(key, type)
      const dataStore = dbReadWrite.objectStore(key)
      resolve(dataStore)
    })
  }

  get (key) {
    return this.requestObjectStore(key)
    .then((dataObject)=> {
      return new Promise((resolve, reject) => {
        const getRequest = dataObject.get(key)
        getRequest.onsuccess = (event) => {
          const serialized = event.currentTarget.result
          try {
            console.log('serialized:',serialized)
            const state = serialized ? JSON.parse(serialized) : {}
            resolve(state)
          } catch (err) {
            reject(err)
          }
        }
        getRequest.onerror = (event) => reject(event)
      })
    })
  }

  put (key, state) {
    return this.requestObjectStore(key, 'readwrite')
    .then((dataObject)=> {
      return new Promise((resolve, reject) => {
        try {
          const serialized = JSON.stringify(state)
          const putRequest = dataObject.put(serialized)
          putRequest.onsuccess = (event) => resolve(event.currentTarget.result)
          putRequest.onerror = (event) => reject(event)
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  update (key, value) {

  }

  migrate () {
    this.db.createObjectStore(this.name)
  }

  _add (key, objStore, cb = logger) {
    return this.requestObjectStore(key, 'readwrite')
    .then((dataObject)=> {
      const addRequest = dataObject.add(objStore, key)
      addRequest.onsuccess = (event) => Promise.resolve(event.currentTarget.result)
      addRequest.onerror = (event) => Promise.reject(event)
    })
  }

}

function logger (err, ress) {
  err ? console.error(`Logger says: ${err}`) : console.dir(`Logger says: ${ress}`)
}
