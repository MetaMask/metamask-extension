// polyfill fetch
global.fetch = global.fetch || function () {return Promise.resolve({
    json: () => { return Promise.resolve({"mainnet": "ok", "ropsten": "degraded", "kovan": "down", "rinkeby": "ok"}) },
  })
}
const assert = require('assert')
const InfuraController = require('../../app/scripts/controllers/infura')

describe('infura-controller', function () {
  var infuraController

  beforeEach(function () {
    infuraController = new InfuraController()
  })

  describe('network status queries', function () {
    describe('#checkInfuraNetworkStatus', function () {
      it('should return an object reflecting the network statuses', function (done) {
        this.timeout(15000)
        infuraController.checkInfuraNetworkStatus()
          .then(() => {
            const networkStatus = infuraController.store.getState().infuraNetworkStatus
            const networkStatus2 = infuraController.store.getState()
            assert.equal(Object.keys(networkStatus).length, 4)
            assert.equal(networkStatus.mainnet, 'ok')
            assert.equal(networkStatus.ropsten, 'degraded')
            assert.equal(networkStatus.kovan, 'down')
          })
          .then(() => done())
          .catch(done)

      })
    })
  })
})
