const assert = require('assert')
const nock = require('nock')
const NetworkController = require('../../app/scripts/controllers/network')
const {
  getNetworkDisplayName,
  getNetworkEndpoints,
} = require('../../app/scripts/controllers/network/util')

const { createTestProviderTools } = require('../stub/provider')
const providerResultStub = {}
const provider = createTestProviderTools({ scaffold: providerResultStub }).provider

describe('# Network Controller', function () {
  let networkController
  const noop = () => {}
  const networkControllerProviderInit = {
    getAccounts: noop,
  }

  beforeEach(function () {

    nock('https://rinkeby.infura.io')
      .persist()
      .post('/metamask')
      .reply(200)

    networkController = new NetworkController({
      provider,
    })

    networkController.initializeProvider(networkControllerProviderInit, provider)
  })

  afterEach(function () {
    nock.cleanAll()
  })

  describe('network', function () {
    describe('#provider', function () {
      it('provider should be updatable without reassignment', function () {
        networkController.initializeProvider(networkControllerProviderInit, provider)
        const proxy = networkController._proxy
        proxy.setTarget({ test: true, on: () => {} })
        assert.ok(proxy.test)
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

describe('# Network utils', () => {
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
        input: 'ropsten',
        expected: 'Ropsten',
      }, {
        input: 'rinkeby',
        expected: 'Rinkeby',
      }, {
        input: 'kovan',
        expected: 'Kovan',
      }, {
        input: 'mainnet',
        expected: 'Main Ethereum Network',
      },
    ]

    tests.forEach(({ input, expected }) => assert.equal(getNetworkDisplayName(input), expected))
  })

  it('getNetworkEndpoints should return the correct endpoints', () => {
    assert.equal(getNetworkEndpoints('networkBeta').ropsten, 'https://ropsten.infura.io/metamask2')
    assert.equal(getNetworkEndpoints('network').rinkeby, 'https://rinkeby.infura.io/metamask')
  })
})
