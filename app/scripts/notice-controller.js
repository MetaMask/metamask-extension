const EventEmitter = require('events').EventEmitter

module.exports = class NoticeController extends EventEmitter {

  constructor (opts) {
    super()
    this.configManager = opts.configManager
  }

  getState() {
    var lastUnreadNotice = this.configManager.getLatestUnreadNotice()

    return {
      lastUnreadNotice: lastUnreadNotice,
      noActiveNotices: !lastUnreadNotice,
    }
  }
}
