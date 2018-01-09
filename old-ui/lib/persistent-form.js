const inherits = require('util').inherits
const Component = require('react').Component
const defaultKey = 'persistent-form-default'
const eventName = 'keyup'

module.exports = PersistentForm

function PersistentForm () {
  Component.call(this)
}

inherits(PersistentForm, Component)

PersistentForm.prototype.componentDidMount = function () {
  const fields = document.querySelectorAll('[data-persistent-formid]')
  const store = this.getPersistentStore()

  for (var i = 0; i < fields.length; i++) {
    const field = fields[i]
    const key = field.getAttribute('data-persistent-formid')
    const cached = store[key]
    if (cached !== undefined) {
      field.value = cached
    }

    field.addEventListener(eventName, this.persistentFieldDidUpdate.bind(this))
  }
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
  this.setPersistentStore(store)
}

PersistentForm.prototype.componentWillUnmount = function () {
  const fields = document.querySelectorAll('[data-persistent-formid]')
  for (var i = 0; i < fields.length; i++) {
    const field = fields[i]
    field.removeEventListener(eventName, this.persistentFieldDidUpdate.bind(this))
  }
  this.setPersistentStore({})
}

