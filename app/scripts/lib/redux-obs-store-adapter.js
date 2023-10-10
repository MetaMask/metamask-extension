import SafeEventEmitter from '@metamask/safe-event-emitter'

export default class ReduxObsStoreAdapter extends SafeEventEmitter {
  constructor(getState, subscribe) {
    super()
    this.getState = getState
    this.currentSliceState = this.getState()
    this.listeners = []
    subscribe(() => {
      const sliceState = this.getState()
      if (this.currentSliceState !== sliceState) {
        this.currentSliceState = sliceState
        for (const listener of this.listeners) {
          listener(sliceState)
        }
      }
    })
  }

  getState() {
    return this.getState()
  }

  putState() {
    throw new Error('Method not implemented')
  }

  subscribe(handler) {
    this.listeners.push(handler)
  }

  unsubscribe(handler) {
    const index = this.listeners.findIndex((listener) => listener === handler)
    if (index) {
      this.listeners.slice(index, 1)
    }
  }

  updateState() {
    throw new Error('Method not implemented')
  }
}
