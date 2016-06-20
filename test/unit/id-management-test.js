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
    const message = '0x96b8d442f4c09a08d266bf37b18219465cfb341c1b3ab9792a6103a93583fdf7'
    const privateKey = '0xd291f7aa01b94941b446f260bca42c0752762571428ad4ed6239613c66365cf4'
    const expectedResult = '0x04881196121781472543750166203264808665659193717384627772472141185319786561270240926993050673320157359365329096037150419976876479876332927284781689204045461c'

    const idManagement = new IdManagement()
    const exportKeyStub = sinon.stub(idManagement, 'exportPrivateKey', (addr) => {
      assert.equal(addr, address)
      return privateKey
    })

    const result = idManagement.signMsg(address, message)
    assert.equal(result, expectedResult)
  })
})
