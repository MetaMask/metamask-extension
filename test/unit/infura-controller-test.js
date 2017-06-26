// polyfill fetch
global.fetch = global.fetch || require('isomorphic-fetch')

const assert = require('assert')
const nock = require('nock')
const InfuraController = require('../../app/scripts/controllers/infura')

describe('infura-controller', function () {
  var infuraController

  beforeEach(function () {
    infuraController = new InfuraController()
  })

  describe('network status queries', function () {
    describe('#checkInfuraNetworkStatus', function () {
      it('should return an object reflecting the network statuses', function () {
        this.timeout(15000)
        nock('https://api.infura.io')
          .get('/v1/status/metamask')
          .reply(200, '{"mainnet": "ok", "ropsten": "degraded", "kovan": "down", "rinkeby": "ok"}')

        infuraController.checkInfuraNetworkStatus()
          .then(() => {
            const networkStatus = infuraController.store.getState().infuraNetworkStatus
            assert.equal(Object.keys(networkStatus).length, 4)
            assert.equal(networkStatus.mainnet, 'ok')
            assert.equal(networkStatus.ropsten, 'degraded')
            assert.equal(networkStatus.kovan, 'down')
          })
      })
    })
  })
})
