const assert = require('assert')
const NoticeController = require('../../../../app/scripts/notice-controller')

describe('notice-controller', function () {
  var noticeController

  beforeEach(function () {
    noticeController = new NoticeController({})
  })

  describe('notices', function () {

    describe('#setNoticesList', function () {
      it('should set data appropriately', function (done) {
        var testList = [{
          id: 0,
          read: false,
          title: 'Futuristic Notice',
        }]
        noticeController.setNoticesList(testList)
        var testListId = noticeController.getNoticesList()[0].id
        assert.equal(testListId, 0)
        done()
      })
    })

    describe('#markNoticeRead', function () {
      it('should mark a notice as read', function (done) {
        var testList = [{
          id: 0,
          read: false,
          title: 'Futuristic Notice',
        }]
        noticeController.setNoticesList(testList)
        noticeController.markNoticeRead(testList[0])
        var newList = noticeController.getNoticesList()
        assert.ok(newList[0].read)
        done()
      })
    })

    describe('#getNextUnreadNotice', function () {
      it('should retrieve the latest unread notice', function (done) {
        var testList = [
          {id: 0, read: true, title: 'Past Notice'},
          {id: 1, read: false, title: 'Current Notice'},
          {id: 2, read: false, title: 'Future Notice'},
        ]
        noticeController.setNoticesList(testList)
        var latestUnread = noticeController.getNextUnreadNotice()
        assert.equal(latestUnread.id, 1)
        done()
      })
      it('should return undefined if no unread notices exist.', function (done) {
        var testList = [
          {id: 0, read: true, title: 'Past Notice'},
          {id: 1, read: true, title: 'Current Notice'},
          {id: 2, read: true, title: 'Future Notice'},
        ]
        noticeController.setNoticesList(testList)
        var latestUnread = noticeController.getNextUnreadNotice()
        assert.ok(!latestUnread)
        done()
      })
    })
  })
})
