const ObservableStore = require('obs-store')
const extend = require('xtend')

class DisplayController {

  constructor (opts = {}) {
    const initState = extend({
      firstTime: true,
    }, opts.initState)
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  finishFirstTime (cb) {
    this.store.updateState({ firstTime: false })
    return Promise.resolve()
  }

}

module.exports = DisplayController
