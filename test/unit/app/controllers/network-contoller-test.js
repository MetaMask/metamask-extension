const assert = require('assert')
const nock = require('nock')
const NetworkController = require('../../../../app/scripts/controllers/network')
const {
  getNetworkDisplayName,
} = require('../../../../app/scripts/controllers/network/util')

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
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, 'loading', 'network is loading')
      })
    })

    describe('#setNetworkState', function () {
      it('should update the network', function () {
        networkController.setNetworkState(1, 'mainnet')
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, 1, 'network is 1')
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
    })
  })
})

describe('Network utils', () => {
  it('getNetworkDisplayName should return the correct network name', () => {
    const tests = [
      {
        input: 3,
        expected: 'Ropsten Testnet',
      }, {
        input: 4,
        expected: 'Rinkeby Testnet',
      }, {
        input: 42,
        expected: 'Kovan Testnet',
      }, {
        input: 77,
        expected: 'Sokol Testnet',
      }, {
        input: 'ropsten',
        expected: 'Ropsten Testnet',
      }, {
        input: 'rinkeby',
        expected: 'Rinkeby Testnet',
      }, {
        input: 'kovan',
        expected: 'Kovan Testnet',
      }, {
        input: 'sokol',
        expected: 'Sokol Testnet',
      }, {
        input: 'mainnet',
        expected: 'Ethereum',
      },
    ]

    tests.forEach(({ input, expected }) => assert.equal(getNetworkDisplayName(input), expected))
  })
})
