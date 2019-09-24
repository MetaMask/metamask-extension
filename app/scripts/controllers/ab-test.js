const ObservableStore = require('obs-store')
const extend = require('xtend')
const { getRandomArrayItem } = require('../lib/util')

/**
 * a/b test descriptions:
 * - `fullScreenVsPopup`:
 *   - description: tests whether showing tx confirmations in full screen in the browser will increase rates of successful
 *   confirmations
 *   - groups:
 *     - popup: this is the control group, which follows the current UX of showing tx confirmations in the notification
 *     window
 *     - fullScreen: this is the only test group, which will cause users to be shown tx confirmations in a full screen
 *     browser tab
 */

class ABTestController {
  /**
   * @constructor
   * @param opts
   */
  constructor (opts = {}) {
    const { initState } = opts
    this.store = new ObservableStore(extend({
      abTests: {
        fullScreenVsPopup: this._getRandomizedTestGroupName('fullScreenVsPopup'),
      },
    }, initState))
  }

  /**
   * Returns the name of the test group to which the current user has been assigned
   * @param {string} abTestKey the key of the a/b test
   * @return {string} the name of the assigned test group
   */
  getAssignedABTestGroupName (abTestKey) {
    return this.store.getState().abTests[abTestKey]
  }

  /**
   * Returns a randomly chosen name of a test group from a given a/b test
   * @param {string} abTestKey the key of the a/b test
   * @return {string} the name of the randomly selected test group
   * @private
   */
  _getRandomizedTestGroupName (abTestKey) {
    const nameArray = ABTestController.abTestGroupNames[abTestKey]
    return getRandomArrayItem(nameArray)
  }
}

ABTestController.abTestGroupNames = {
  fullScreenVsPopup: ['control', 'fullScreen'],
}

module.exports = ABTestController

