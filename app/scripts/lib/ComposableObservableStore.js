const ObservableStore = require('obs-store')

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
      flatState = { ...flatState, ...this.config[key].getState() }
    }
    return flatState
  }

  /**
   * Merges all child store state into a single object rather than
   * returning an object keyed by child store class name
   * Removes heavy objects that are not needed on UI
   *
   * @returns {Object} - Object containing merged child store state
   */
  getFilteredFlatState () {
    let flatState = {}
    for (const key in this.config) {
      let nextState
      if (key === 'RecentBlocksController') {
        nextState = {}
      } else if (key === 'TxController') {
        const state = this.config[key].getState()
        const txList = state.selectedAddressTxList.map(
          item => ({...item, history: null, nonceDetails: null})
        )
        nextState = {
          ...state,
          selectedAddressTxList: txList,
        }
      } else {
        nextState = this.config[key].getState()
      }
      flatState = { ...flatState, ...nextState }
    }
    return flatState
  }
}

module.exports = ComposableObservableStore
