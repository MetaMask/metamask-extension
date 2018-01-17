const { shallow, mount } = require('enzyme')

exports.shallowWithStore = function shallowWithStore (component, store) {
  const context = {
    store,
  }

  return shallow(component, { context })
}

exports.mountWithStore = function mountWithStore (component, store) {
  const context = {
    store,
  }
  return mount(component, { context })
}
