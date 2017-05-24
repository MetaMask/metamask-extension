const assert = require('assert')
const NetworkController = require('../../app/scripts/controllers/network')

describe('# Network Controller', function () {
  let networkController

  beforeEach(function () {
    networkController = new NetworkController({
      provider: {
        type: 'rinkeby',
      },
    })
    // stub out provider
    networkController._provider = new Proxy({}, {
      get: (obj, name) => {
        return () => {}
      },
    })
    networkController.providerInit = {
      getAccounts: () => {},
    }

    networkController.ethQuery = new Proxy({}, {
      get: (obj, name) => {
        return () => {}
      },
    })
  })
  describe('network', function () {
    describe('#provider', function() {
      it('provider should be updatable without reassignment', function () {
        networkController.initializeProvider(networkController.providerInit)
        const provider = networkController.provider
        networkController._provider = {test: true}
        assert.ok(provider.test)
      })
    })
    describe('#getNetworkState', function () {
      it('should return loading when new', function () {
        let networkState = networkController.getNetworkState()
        assert.equal(networkState, 'loading', 'network is loading')
      })
    })

    describe('#setNetworkState', function () {
      it('should update the network', function () {
        networkController.setNetworkState(1)
        let networkState = networkController.getNetworkState()
        assert.equal(networkState, 1, 'network is 1')
      })
    })

    describe('#getRpcAddressForType', function () {
      it('should return the right rpc address', function () {
        let rpcTarget = networkController.getRpcAddressForType('mainnet')
        assert.equal(rpcTarget, 'https://mainnet.infura.io/metamask', 'returns the right rpcAddress')
      })
    })
    describe('#setProviderType', function () {
      it('should update provider.type', function () {
        networkController.setProviderType('mainnet')
        const type = networkController.getProviderConfig().type
        assert.equal(type, 'mainnet', 'provider type is updated')
      })
      it('should set the network to loading', function () {
        networkController.setProviderType('mainnet')
        const loading = networkController.isNetworkLoading()
        assert.ok(loading, 'network is loading')
      })
      it('should set the right rpcTarget', function () {
        networkController.setProviderType('mainnet')
        const rpcTarget = networkController.getProviderConfig().rpcTarget
        assert.equal(rpcTarget, 'https://mainnet.infura.io/metamask', 'returns the right rpcAddress')
      })
    })
  })
})
