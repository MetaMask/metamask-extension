const inherits = require('util').inherits
const Component = require('react').Component
const defaultKey = 'persistent-form-default'
const eventName = 'keyup'//.persistent-form-change'//.persistent-form-change'

module.exports = PersistentForm

function PersistentForm () {
  Component.call(this)
}

inherits(PersistentForm, Component)

PersistentForm.prototype.componentDidMount = function () {
  const fields = document.querySelectorAll('[data-persistent-formid]')
  const store = this.getPersistentStore()
  fields.forEach((field) => {
    const key = field.getAttribute('data-persistent-formid')
    const val = field.value
    const cached = store[key]
    if (cached !== undefined) {
      field.value = cached
    }

    field.addEventListener(eventName, this.persistentFieldDidUpdate.bind(this))
  })
}

PersistentForm.prototype.getPersistentStore = function () {
  let store = window.localStorage[this.persistentFormParentId || defaultKey]
  if (store && store !== 'null') {
    store = JSON.parse(store)
  } else {
    store = {}
  }
  return store
}

PersistentForm.prototype.setPersistentStore = function (newStore) {
  window.localStorage[this.persistentFormParentId || defaultKey] = JSON.stringify(newStore)
}

PersistentForm.prototype.persistentFieldDidUpdate = function (event) {
  const field = event.target
  const store = this.getPersistentStore()
  const key = field.getAttribute('data-persistent-formid')
  const val = field.value
  store[key] = val
  console.log(val)
  this.setPersistentStore(store)
}

PersistentForm.prototype.componentWillUnmount = function () {
  const fields = document.querySelectorAll('[data-persistent-formid]')
  const store = this.getPersistentStore()
  fields.forEach((field) => {
    field.removeEventListener(eventName, this.persistentFieldDidUpdate.bind(this))
  })
  this.setPersistentStore({})
}
