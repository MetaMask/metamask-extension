import { EventEmitter } from 'events'
import uuid from 'uuid-random'

const actions = new Map()
const listeners = new Map()

const ee = new EventEmitter()

export function registerActionHandler(action, handler) {
  if (actions.has(action)) {
    throw new Error(`A handler for ${action} has already been registered`)
  }
  actions.set(action, handler)
}

export function unregisterActionHandler(action) {
  actions.delete(action)
}

export function resetActionHandlers() {
  actions.clear()
}

export function call(action, params) {
  const handler = actions.get(action)
  if (!handler) {
    throw new Error(`A handler for ${action} has not been registered`)
  }
  return handler(params)
}

export function publish(event, payload) {
  ee.emit(event, payload)
}

export function subscribe(event, handler) {
  const subId = uuid()
  listeners.set(subId, { event, handler })
  ee.on(event, handler)
}

export function unsubscribe(subId) {
  const { event, handler } = listeners.get(subId)
  ee.off(event, handler)
}
