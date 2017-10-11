module.exports = function createObjectProxy(obj) {
  let target = obj
  const proxy = new Proxy({}, {
    get: (obj, name) => {
      // intercept setTarget
      if (name === 'setTarget') return setTarget
      return target[name]
    },
    set: (obj, name, value) => {
      target[name] = value
      return true
    },
  })
  return proxy

  function setTarget (obj) {
    target = obj
  }
}