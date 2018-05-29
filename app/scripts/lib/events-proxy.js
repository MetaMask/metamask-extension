/**
 * Returns an EventEmitter that proxies events from the given event emitter
 * @param {any} eventEmitter
 * @param {object} listeners - The listeners to proxy to
 * @returns {any}
 */
module.exports = function createEventEmitterProxy (eventEmitter, listeners) {
  let target = eventEmitter
  const eventHandlers = listeners || {}
  const proxy = /** @type {any} */ (new Proxy({}, {
    get: (_, name) => {
      // intercept listeners
      if (name === 'on') return addListener
      if (name === 'setTarget') return setTarget
      if (name === 'proxyEventHandlers') return eventHandlers
      return (/** @type {any} */ (target))[name]
    },
    set: (_, name, value) => {
      target[name] = value
      return true
    },
  }))
  function setTarget (/** @type {EventEmitter} */ eventEmitter) {
    target = eventEmitter
    // migrate listeners
    Object.keys(eventHandlers).forEach((name) => {
      /** @type {Array<Function>} */ (eventHandlers[name]).forEach((handler) => target.on(name, handler))
    })
  }
  /**
   * Attaches a function to be called whenever the specified event is emitted
   * @param {string} name
   * @param {Function} handler
   */
  function addListener (name, handler) {
    if (!eventHandlers[name]) eventHandlers[name] = []
    eventHandlers[name].push(handler)
    target.on(name, handler)
  }
  if (listeners) proxy.setTarget(eventEmitter)
  return proxy
}
