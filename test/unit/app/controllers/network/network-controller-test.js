import { strict as assert } from 'assert'
import sinon from 'sinon'
import NetworkController from '../../../../../app/scripts/controllers/network'
import { getNetworkDisplayName } from '../../../../../app/scripts/controllers/network/util'

describe('NetworkController', function () {
  describe('controller', function () {
    let networkController
    const noop = () => undefined
    const networkControllerProviderConfig = {
      getAccounts: noop,
    }

    beforeEach(function () {
      networkController = new NetworkController()
      networkController.setInfuraProjectId('foo')
    })

    describe('#provider', function () {
      it('provider should be updatable without reassignment', function () {
        networkController.initializeProvider(networkControllerProviderConfig)
        const providerProxy = networkController.getProviderAndBlockTracker()
          .provider
        assert.equal(providerProxy.test, undefined)
        providerProxy.setTarget({ test: true })
        assert.equal(providerProxy.test, true)
      })
    })

    describe('#getNetworkState', function () {
      it('should return "loading" when new', function () {
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, 'loading', 'network is loading')
      })
    })

    describe('#setNetworkState', function () {
      it('should update the network', function () {
        networkController.setNetworkState('1')
        const networkState = networkController.getNetworkState()
        assert.equal(networkState, '1', 'network is 1')
      })
    })

    describe('#setProviderType', function () {
      it('should update provider.type', function () {
        networkController.initializeProvider(networkControllerProviderConfig)
        networkController.setProviderType('mainnet')
        const { type } = networkController.getProviderConfig()
        assert.equal(type, 'mainnet', 'provider type is updated')
      })

      it('should set the network to loading', function () {
        networkController.initializeProvider(networkControllerProviderConfig)

        const spy = sinon.spy(networkController, 'setNetworkState')
        networkController.setProviderType('mainnet')

        assert.equal(
          spy.callCount,
          1,
          'should have called setNetworkState 2 times',
        )
        assert.ok(
          spy.calledOnceWithExactly('loading'),
          'should have called with "loading" first',
        )
      })
    })
  })

  describe('utils', function () {
    it('getNetworkDisplayName should return the correct network name', function () {
      const tests = [
        {
          input: '3',
          expected: 'Ropsten',
        },
        {
          input: '4',
          expected: 'Rinkeby',
        },
        {
          input: '42',
          expected: 'Kovan',
        },
        {
          input: '0x3',
          expected: 'Ropsten',
        },
        {
          input: '0x4',
          expected: 'Rinkeby',
        },
        {
          input: '0x2a',
          expected: 'Kovan',
        },
        {
          input: 'ropsten',
          expected: 'Ropsten',
        },
        {
          input: 'rinkeby',
          expected: 'Rinkeby',
        },
        {
          input: 'kovan',
          expected: 'Kovan',
        },
        {
          input: 'mainnet',
          expected: 'Ethereum Mainnet',
        },
        {
          input: 'goerli',
          expected: 'Goerli',
        },
      ]

      tests.forEach(({ input, expected }) =>
        assert.equal(getNetworkDisplayName(input), expected),
      )
    })
  })
})
