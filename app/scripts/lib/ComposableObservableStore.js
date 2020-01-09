import ObservableStore from 'obs-store'

/**
 * An ObservableStore that can composes a flat
 * structure of child stores based on configuration
 */
class ComposableObservableStore extends ObservableStore {
  /**
   * Create a new store
   *
   * @param {Object} [initState] - The initial store state
   * @param {Object} [config] - Map of internal state keys to child stores
   */
  constructor (initState, config) {
    super(initState)
    this.updateStructure(config)
  }

  /**
   * Composes a new internal store subscription structure
   *
   * @param {Object} [config] - Map of internal state keys to child stores
   */
  updateStructure (config) {
    this.config = config
    this.removeAllListeners()
    for (const key in config) {
      config[key].subscribe((state) => {
        this.updateState({ [key]: state })
      })
    }
  }

  /**
   * Merges all child store state into a single object rather than
   * returning an object keyed by child store class name
   *
   * @returns {Object} - Object containing merged child store state
   */
  getFlatState () {
    let flatState = {}
    for (const key in this.config) {
      const controller = this.config[key]
      const state = controller.getState ? controller.getState() : controller.state
      flatState = { ...flatState, ...state }
    }
    return flatState
  }
}

export default ComposableObservableStore
