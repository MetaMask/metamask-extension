const assert = require('assert')
const nock = require('nock')
const NetworkController = require('../../../../../app/scripts/controllers/network')
const {
  getNetworkDisplayName,
} = require('../../../../../app/scripts/controllers/network/util')

describe('# Network Controller', function () {
  let networkController
  const noop = () => {}
  const networkControllerProviderConfig = {
    getAccounts: noop,
  }

  beforeEach(function () {

    nock('https://rinkeby.infura.io')
      .persist()
      .post('/metamask')
      .reply(200)

    networkController = new NetworkController()

    networkController.initializeProvider(networkControllerProviderConfig)
  })

  afterEach(function () {
    nock.cleanAll()
  })

  describe('network', function () {
    describe('#provider', function () {
      it('provider should be updatable without reassignment', function () {
        networkController.initializeProvider(networkControllerProviderConfig)
        const providerProxy = networkController.getProviderAndBlockTracker().provider
        assert.equal(providerProxy.test, undefined)
        providerProxy.setTarget({ test: true })
        assert.equal(providerProxy.test, true)
      })
    })
    describe('#getNetworkState', function () {
      it('should return loading when new', function () {
        networkController = new NetworkController()
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, 'loading')
      })
    })

    describe('#setNetworkState', function () {
      it('should update the network', function () {
        networkController.setNetworkState(1, 'custom#eth:rpc')
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, 1, 'network is 1')
      })
    })

    describe('#setProviderType', function () {
      it('should update provider.type', function () {
        networkController.setProviderType('default#eth:mainnet')
        const type = networkController.getProviderConfig().type
        assert.equal(type, 'default#eth:mainnet', 'provider type is updated')
      })
      it('should set the network to loading', function () {
        networkController.setProviderType('default#eth:mainnet')
        const loading = networkController.isNetworkLoading()
        assert.ok(loading, 'network is loading')
      })
    })
  })
  describe('#updateRpc', function () {
    it('should update the networkConfigs properly', () => {
      const expectedLength = networkController.networkConfigs.length + 1
      networkController.updateRpc({ rpcUrl: 'test', custom: { chainId: 1 }})
      assert.deepEqual(networkController.networkConfigs[networkController.networkConfigs.length - 1], { type: 'custom#eth:rpc', rpcUrl: 'test', custom: { chainId: 1, ticker: 'ETH' }})

      networkController.updateRpc({ rpcUrl: 'test', custom: { chainId: 2 }})
      assert.deepEqual(networkController.networkConfigs[networkController.networkConfigs.length - 1], { type: 'custom#eth:rpc', rpcUrl: 'test', custom: { chainId: 2, ticker: 'ETH' }})

      assert.equal(expectedLength, networkController.networkConfigs.length, 'should only have added one entry')

      networkController.updateRpc({ rpcUrl: 'test/1', custom: { chainId: 1 }})
      networkController.updateRpc({ rpcUrl: 'test/2', custom: { chainId: 1 }})
      networkController.updateRpc({ rpcUrl: 'test/3', custom: { chainId: 1 }})

      assert.deepEqual(networkController.networkConfigs[networkController.networkConfigs.length - 1], { type: 'custom#eth:rpc', rpcUrl: 'test/3', custom: { chainId: 1, ticker: 'ETH' }})
    })
  })
})

describe('Network utils', () => {
  it('getNetworkDisplayName should return the correct network name', () => {
    const tests = [
      {
        input: 3,
        expected: 'Ropsten',
      }, {
        input: 4,
        expected: 'Rinkeby',
      }, {
        input: 42,
        expected: 'Kovan',
      }, {
        input: 'default#eth:ropsten',
        expected: 'Ropsten',
      }, {
        input: 'default#eth:rinkeby',
        expected: 'Rinkeby',
      }, {
        input: 'default#eth:kovan',
        expected: 'Kovan',
      }, {
        input: 'default#eth:mainnet',
        expected: 'Main Ethereum Network',
      }, {
        input: 'default#eth:goerli',
        expected: 'Goerli',
      },
    ]

    tests.forEach(({ input, expected }) => assert.equal(getNetworkDisplayName(input), expected))
  })
})
