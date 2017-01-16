const EventEmitter = require('events').EventEmitter
const hardCodedNotices = require('../../development/notices.json')

module.exports = class NoticeController extends EventEmitter {

  constructor (opts) {
    super()
    this.configManager = opts.configManager
    this.noticePoller = null
  }

  getState () {
    var lastUnreadNotice = this.getLatestUnreadNotice()

    return {
      lastUnreadNotice: lastUnreadNotice,
      noActiveNotices: !lastUnreadNotice,
    }
  }

  getNoticesList () {
    var data = this.configManager.getData()
    if ('noticesList' in data) {
      return data.noticesList
    } else {
      return []
    }
  }

  setNoticesList (list) {
    var data = this.configManager.getData()
    data.noticesList = list
    this.configManager.setData(data)
    return Promise.resolve(true)
  }

  markNoticeRead (notice, cb) {
    cb = cb || function (err) { if (err) throw err }
    try {
      var notices = this.getNoticesList()
      var id = notice.id
      notices[id].read = true
      this.setNoticesList(notices)
      const latestNotice = this.getLatestUnreadNotice()
      cb(null, latestNotice)
    } catch (err) {
      cb(err)
    }
  }

  updateNoticesList () {
    return this._retrieveNoticeData().then((newNotices) => {
      var oldNotices = this.getNoticesList()
      var combinedNotices = this._mergeNotices(oldNotices, newNotices)
      return Promise.resolve(this.setNoticesList(combinedNotices))
    })
  }

  getLatestUnreadNotice () {
    var notices = this.getNoticesList()
    var filteredNotices = notices.filter((notice) => {
      return notice.read === false
    })
    return filteredNotices[filteredNotices.length - 1]
  }

  startPolling () {
    if (this.noticePoller) {
      clearInterval(this.noticePoller)
    }
    this.noticePoller = setInterval(() => {
      this.noticeController.updateNoticesList()
    }, 300000)
  }

  _mergeNotices (oldNotices, newNotices) {
    var noticeMap = this._mapNoticeIds(oldNotices)
    newNotices.forEach((notice) => {
      if (noticeMap.indexOf(notice.id) === -1) {
        oldNotices.push(notice)
      }
    })
    return oldNotices
  }

  _mapNoticeIds (notices) {
    return notices.map((notice) => notice.id)
  }

  _retrieveNoticeData () {
    // Placeholder for the API.
    return Promise.resolve(hardCodedNotices)
  }


}
