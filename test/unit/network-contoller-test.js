const assert = require('assert')
const NetworkController = require('../../app/scripts/controllers/network')

describe('# Network Controller', function () {
  let networkController
  const networkControllerProviderInit = {
    getAccounts: () => {},
  }

  beforeEach(function () {
    networkController = new NetworkController({
      provider: {
        type: 'rinkeby',
      },
    })

    networkController.initializeProvider(networkControllerProviderInit)
  })
  describe('network', function () {
    describe('#provider', function () {
      it('provider should be updatable without reassignment', function () {
        networkController.initializeProvider(networkControllerProviderInit)
        const providerProxy = networkController.providerProxy
        providerProxy.setTarget({ test: true })
        assert.ok(providerProxy.test)
      })
    })
    describe('#getNetworkState', function () {
      it('should return loading when new', function () {
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, 'loading', 'network is loading')
      })
    })

    describe('#setNetworkState', function () {
      it('should update the network', function () {
        networkController.setNetworkState(1)
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, 1, 'network is 1')
      })
    })

    describe('#getRpcAddressForType', function () {
      it('should return the right rpc address', function () {
        const rpcTarget = networkController.getRpcAddressForType('mainnet')
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

function noop() {}