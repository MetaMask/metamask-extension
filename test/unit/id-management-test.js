var assert = require('assert')
var IdManagement = require('../../app/scripts/lib/id-management')
var sinon = require('sinon')

describe('IdManagement', function() {

  beforeEach(function() {
    // sinon allows stubbing methods that are easily verified
    this.sinon = sinon.sandbox.create()
    window.localStorage = {} // Hacking localStorage support into JSDom
  })

  afterEach(function() {
    // sinon requires cleanup otherwise it will overwrite context
    this.sinon.restore()
  })

  describe('#signMsg', function () {
    const address = '0x926cD0393816429a580037475ec23eD65fDC893B'
    const message = '0x0987654321abcdef'
    const privateKey = '0xd291f7aa01b94941b446f260bca42c0752762571428ad4ed6239613c66365cf4'
    const expectedResult = 'foo'

    const idManagement = new IdManagement()
    const exportKeyStub = sinon.stub(idManagement, 'exportPrivateKey', () => privateKey)

    const result = idManagement.signMsg(address, message)
    console.log(result)
    assert.equal(result, expectedResult)
  })
})
