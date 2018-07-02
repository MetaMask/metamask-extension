const EventEmitter = require('events').EventEmitter
const semver = require('semver')
const extend = require('xtend')
const ObservableStore = require('obs-store')
const hardCodedNotices = require('../../notices/notices.js')
const uniqBy = require('lodash.uniqby')

module.exports = class NoticeController extends EventEmitter {

  constructor (opts) {
    super()
    this.noticePoller = null
    this.firstVersion = opts.firstVersion
    this.version = opts.version
    const initState = extend({
      noticesList: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
    // setup memStore
    this.memStore = new ObservableStore({})
    this.store.subscribe(() => this._updateMemstore())
    this._updateMemstore()
    // pull in latest notices
    this.updateNoticesList()
  }

  getNoticesList () {
    return this.store.getState().noticesList
  }

  getUnreadNotices () {
    const notices = this.getNoticesList()
    return notices.filter((notice) => notice.read === false)
  }

  getNextUnreadNotice () {
    const unreadNotices = this.getUnreadNotices()
    return unreadNotices[0]
  }

  async setNoticesList (noticesList) {
    this.store.updateState({ noticesList })
    return true
  }

  markNoticeRead (noticeToMark, cb) {
    cb = cb || function (err) { if (err) throw err }
    try {
      var notices = this.getNoticesList()
      var index = notices.findIndex((currentNotice) => currentNotice.id === noticeToMark.id)
      notices[index].read = true
      notices[index].body = ''
      this.setNoticesList(notices)
      const latestNotice = this.getNextUnreadNotice()
      cb(null, latestNotice)
    } catch (err) {
      cb(err)
    }
  }

  async updateNoticesList () {
    const newNotices = await this._retrieveNoticeData()
    const oldNotices = this.getNoticesList()
    const combinedNotices = this._mergeNotices(oldNotices, newNotices)
    const filteredNotices = this._filterNotices(combinedNotices)
    const result = this.setNoticesList(filteredNotices)
    this._updateMemstore()
    return result
  }

  _mergeNotices (oldNotices, newNotices) {
    return uniqBy(oldNotices.concat(newNotices), 'id')
  }

  _filterNotices (notices) {
    return notices.filter((newNotice) => {
      if ('version' in newNotice) {
        const satisfied = semver.satisfies(this.version, newNotice.version)
        return satisfied
      }
      if ('firstVersion' in newNotice) {
        const satisfied = semver.satisfies(this.firstVersion, newNotice.firstVersion)
        return satisfied
      }
      return true
    })
  }

  async _retrieveNoticeData () {
    // Placeholder for remote notice API.
    return hardCodedNotices
  }

  _updateMemstore () {
    const nextUnreadNotice = this.getNextUnreadNotice()
    const noActiveNotices = !nextUnreadNotice
    this.memStore.updateState({ nextUnreadNotice, noActiveNotices })
  }

}
