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
    it('passes the dennis test', function() {
      const address = '0x9858e7d8b79fc3e6d989636721584498926da38a'
      const message = '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0'
      const privateKey = '0x7dd98753d7b4394095de7d176c58128e2ed6ee600abe97c9f6d9fd65015d9b18'
      const expectedResult = '0x28fcb6768e5110144a55b2e6ce9d1ea5a58103033632d272d2b5cf506906f7941a00b539383fd872109633d8c71c404e13dba87bc84166ee31b0e36061a69e161c'

      const idManagement = new IdManagement()
      const exportKeyStub = sinon.stub(idManagement, 'exportPrivateKey', (addr) => {
        assert.equal(addr, address)
        return privateKey
      })

      const result = idManagement.signMsg(address, message)
      assert.equal(result, expectedResult)
    })
  })
})
