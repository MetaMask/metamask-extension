const EventEmitter = require('events').EventEmitter
const extend = require('xtend')
const ObservableStore = require('obs-store')
const hardCodedNotices = require('../../notices/notices.json')

module.exports = class NoticeController extends EventEmitter {

  constructor (opts) {
    super()
    this.noticePoller = null
    const initState = extend({
      noticesList: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
    this.memStore = new ObservableStore({})
    this.store.subscribe(() => this._updateMemstore())
  }

  getNoticesList () {
    return this.store.getState().noticesList
  }

  getUnreadNotices () {
    const notices = this.getNoticesList()
    return notices.filter((notice) => notice.read === false)
  }

  getLatestUnreadNotice () {
    const unreadNotices = this.getUnreadNotices()
    return unreadNotices[unreadNotices.length - 1]
  }

  setNoticesList (noticesList) {
    this.store.updateState({ noticesList })
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

  _updateMemstore () {
    const lastUnreadNotice = this.getLatestUnreadNotice()
    const noActiveNotices = !lastUnreadNotice
    this.memStore.updateState({ lastUnreadNotice, noActiveNotices })
  }

}
