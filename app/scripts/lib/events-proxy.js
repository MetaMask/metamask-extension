module.exports = function createEventEmitterProxy(eventEmitter, listeners) {
  let target = eventEmitter
  const eventHandlers = listeners || {}
  const proxy = new Proxy({}, {
    get: (obj, name) => {
      // intercept listeners
      if (name === 'on') return addListener
      if (name === 'setTarget') return setTarget
      if (name === 'proxyEventHandlers') return eventHandlers
      return target[name]
    },
    set: (obj, name, value) => {
      target[name] = value
      return true
    },
  })
  function setTarget (eventEmitter) {
    target = eventEmitter
    // migrate listeners
    Object.keys(eventHandlers).forEach((name) => {
      eventHandlers[name].forEach((handler) => target.on(name, handler))
    })
  }
  function addListener (name, handler) {
    if (!eventHandlers[name]) eventHandlers[name] = []
    eventHandlers[name].push(handler)
    target.on(name, handler)
  }
  if (listeners) proxy.setTarget(eventEmitter)
  return proxy
}