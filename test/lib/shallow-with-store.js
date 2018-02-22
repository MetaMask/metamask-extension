const { shallow, mount } = require('enzyme')

module.exports = {
  shallowWithStore,
  mountWithStore,
}

function shallowWithStore (component, store) {
  const context = {
    store,
  }
  return shallow(component, {context})
}

function mountWithStore (component, store) {
  const context = {
    store,
  }
  return mount(component, {context})
}
