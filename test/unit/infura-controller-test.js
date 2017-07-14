const assert = require('assert')
const InfuraController = require('../../app/scripts/controllers/infura')

describe('infura-controller', function () {
  var infuraController
  let response

  before(async function () {
    infuraController = new InfuraController()
    response = await infuraController.checkInfuraNetworkStatus()
  })

  describe('Network status queries', function () {
    it('should return object/json', function () {
      assert.equal(typeof response, 'object')
    })

    describe('Mainnet', function () {
      it('should have Mainnet', function () {
        assert.equal(Object.keys(response)[0], 'mainnet')
      })

      it('should have a value for Mainnet status', function () {
        assert(response.mainnet, 'Mainnet status')
      })
    })

    describe('Ropsten', function () {
      it('should have Ropsten', function () {
        assert.equal(Object.keys(response)[1], 'ropsten')
      })

      it('should have a value for Ropsten status', function () {
        assert(response.ropsten, 'Ropsten status')
      })
    })

    describe('Kovan', function () {
      it('should have Kovan', function () {
        assert.equal(Object.keys(response)[2], 'kovan')
      })

      it('should have a value for Kovan status', function () {
        assert(response.kovan, 'Kovan status')
      })
    })

    describe('Rinkeby', function () {
      it('should have Rinkeby', function () {
        assert.equal(Object.keys(response)[3], 'rinkeby')
      })

      it('should have a value for Rinkeby status', function () {
        assert(response.rinkeby, 'Rinkeby status')
      })
    })
  })
})
