var assert = require('assert')
var sinon = require('sinon')
const ethUtil = require('ethereumjs-util')
global.chrome = {}
global.browser = {}

var path = require('path')
var Extension = require(path.join(__dirname, '..', '..', 'app', 'scripts', 'lib', 'extension-instance.js'))

describe('extension', function() {

  describe('extension.getURL', function() {
    const desiredResult = 'http://the-desired-result.io'

    describe('in Chrome or Firefox', function() {
      global.chrome.extension = {
        getURL: () => desiredResult
      }

      it('returns the desired result', function() {
        console.dir(Extension)
        const extension = new Extension()
        console.dir(extension)
        const result = extension.extension.getURL()
        assert.equal(result, desiredResult)
      })
    })

    describe('in Microsoft Edge', function() {
      global.browser.extension = {
        getURL: () => desiredResult
      }

      it('returns the desired result', function() {
        const extension = new Extension()
        const result = extension.extension.getURL()
        assert.equal(result, desiredResult)
      })
    })
  })

  describe('with chrome global', function() {
    let extension

    beforeEach(function() {
      global.chrome = {
        alarms: 'foo'
      }
      extension = new Extension()
    })

    it('should use the chrome global apis', function() {
      assert.equal(extension.alarms, 'foo')
    })
  })

  describe('without chrome global', function() {
    let extension
    let realWindow

    beforeEach(function() {
      realWindow = window
      window = global
      global.chrome = undefined
      global.alarms = 'foo'
      extension = new Extension()
    })

    after(function() {
      window = realWindow
    })

    it('should use the global apis', function() {
      assert.equal(extension.alarms, 'foo')
    })
  })


})
