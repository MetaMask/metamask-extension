const shallow = require('enzyme').shallow

module.exports = shallowWithStore

function shallowWithStore (component, store) {
  const context = {
    store,
  }

  return shallow(component, { context })
};
