const assert = require('assert')
const extend = require('xtend')
const rp = require('request-promise')
const nock = require('nock')
const configManagerGen = require('../lib/mock-config-manager')
const NoticeController = require('../../app/scripts/notice-controller')
const STORAGE_KEY = 'metamask-persistance-key'
// Hacking localStorage support into JSDom
window.localStorage = {}

describe('notice-controller', function() {
  var noticeController

  beforeEach(function() {
    let configManager = configManagerGen()
    noticeController = new NoticeController({
      configManager: configManager,
    })
  })

  describe('notices', function() {
    describe('#getNoticesList', function() {
      it('should return an empty array when new', function() {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        var result = noticeController.getNoticesList()
        assert.equal(result.length, 0)
      })
    })

    describe('#setNoticesList', function() {
      it('should set data appropriately', function () {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        noticeController.setNoticesList(testList)
        var testListId = noticeController.getNoticesList()[0].id
        assert.equal(testListId, 0)
      })
    })

    describe('#updateNoticeslist', function() {
      it('should integrate the latest changes from the source', function() {
        var testList = [{
          id:55,
          read:false,
          title:"Futuristic Notice"
        }]
        noticeController.setNoticesList(testList)
        noticeController.updateNoticesList().then(() => {
          var newList = noticeController.getNoticesList()
          assert.ok(newList[0].id === 55)
          assert.ok(newList[1])
        })
      })
      it('should not overwrite any existing fields', function () {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        noticeController.setNoticesList(testList)
        noticeController.updateNoticesList().then(() => {
          var newList = noticeController.getNoticesList()
          assert.equal(newList[0].id, 0)
          assert.equal(newList[0].title, "Futuristic Notice")
          assert.equal(newList.length, 1)
        })
      })
    })

    describe('#markNoticeRead', function () {
      it('should mark a notice as read', function () {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        noticeController.setNoticesList(testList)
        noticeController.markNoticeRead(testList[0])
        var newList = noticeController.getNoticesList()
        assert.ok(newList[0].read)
      })
    })

    describe('#getLatestUnreadNotice', function () {
      it('should retrieve the latest unread notice', function () {
        var testList = [
          {id:0,read:true,title:"Past Notice"},
          {id:1,read:false,title:"Current Notice"},
          {id:2,read:false,title:"Future Notice"},
        ]
        noticeController.setNoticesList(testList)
        var latestUnread = noticeController.getLatestUnreadNotice()
        assert.equal(latestUnread.id, 2)
      })
      it('should return undefined if no unread notices exist.', function () {
        var testList = [
          {id:0,read:true,title:"Past Notice"},
          {id:1,read:true,title:"Current Notice"},
          {id:2,read:true,title:"Future Notice"},
        ]
        noticeController.setNoticesList(testList)
        var latestUnread = noticeController.getLatestUnreadNotice()
        assert.ok(!latestUnread)
      })
    })
  })

})
