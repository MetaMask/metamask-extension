var assert = require('assert')
var sinon = require('sinon')
const ethUtil = require('ethereumjs-util')

var path = require('path')
var Extension = require(path.join(__dirname, '..', '..', 'app', 'scripts', 'lib', 'extension-instance.js'))

describe('extension', function() {

  describe('with chrome global', function() {
    let extension

    beforeEach(function() {
      window.chrome = {
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

    beforeEach(function() {
      window.chrome = undefined
      window.alarms = 'foo'
      extension = new Extension()
    })

    it('should use the global apis', function() {
      assert.equal(extension.alarms, 'foo')
    })
  })

})
