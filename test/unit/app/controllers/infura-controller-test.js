const assert = require('assert')
const sinon = require('sinon')
const InfuraController = require('../../../../app/scripts/controllers/infura')

describe('infura-controller', function () {
  let infuraController, sandbox, networkStatus
  const response = {'mainnet': 'degraded', 'ropsten': 'ok', 'kovan': 'ok', 'rinkeby': 'down', 'goerli': 'ok'}

  before(async function () {
    infuraController = new InfuraController()
    sandbox = sinon.createSandbox()
    sinon.stub(infuraController, 'checkInfuraNetworkStatus').resolves(response)
    networkStatus = await infuraController.checkInfuraNetworkStatus()
  })

  after(function () {
    sandbox.restore()
  })

  describe('Network status queries', function () {

    describe('Mainnet', function () {
      it('should have Mainnet', function () {
        assert.equal(Object.keys(networkStatus)[0], 'mainnet')
      })

      it('should have a value for Mainnet status', function () {
        assert.equal(networkStatus.mainnet, 'degraded')
      })
    })

    describe('Ropsten', function () {
      it('should have Ropsten', function () {
        assert.equal(Object.keys(networkStatus)[1], 'ropsten')
      })

      it('should have a value for Ropsten status', function () {
        assert.equal(networkStatus.ropsten, 'ok')
      })
    })

    describe('Kovan', function () {
      it('should have Kovan', function () {
        assert.equal(Object.keys(networkStatus)[2], 'kovan')
      })

      it('should have a value for Kovan status', function () {
        assert.equal(networkStatus.kovan, 'ok')
      })
    })

    describe('Rinkeby', function () {
      it('should have Rinkeby', function () {
        assert.equal(Object.keys(networkStatus)[3], 'rinkeby')
      })

      it('should have a value for Rinkeby status', function () {
        assert.equal(networkStatus.rinkeby, 'down')
      })
    })

    describe('Goerli', function () {
      it('should have Goerli', function () {
        assert.equal(Object.keys(networkStatus)[4], 'goerli')
      })

      it('should have a value for Goerli status', function () {
        assert.equal(networkStatus.goerli, 'ok')
      })
    })
  })
})
