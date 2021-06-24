import { strict as assert } from 'assert';
import sinon from 'sinon';
import { getNetworkDisplayName } from './util';
import NetworkController, { NETWORK_EVENTS } from './network';

describe('NetworkController', function () {
  describe('controller', function () {
    let networkController;
    let getLatestBlockStub;
    let setProviderTypeAndWait;
    const noop = () => undefined;
    const networkControllerProviderConfig = {
      getAccounts: noop,
    };

    beforeEach(function () {
      networkController = new NetworkController();
      getLatestBlockStub = sinon
        .stub(networkController, 'getLatestBlock')
        .callsFake(() => Promise.resolve({}));
      networkController.setInfuraProjectId('foo');
      setProviderTypeAndWait = () =>
        new Promise((resolve) => {
          networkController.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, () => {
            resolve();
          });
          networkController.setProviderType('mainnet');
        });
    });

    afterEach(function () {
      getLatestBlockStub.reset();
    });

    describe('#provider', function () {
      it('provider should be updatable without reassignment', function () {
        networkController.initializeProvider(networkControllerProviderConfig);
        const providerProxy = networkController.getProviderAndBlockTracker()
          .provider;
        assert.equal(providerProxy.test, undefined);
        providerProxy.setTarget({ test: true });
        assert.equal(providerProxy.test, true);
      });
    });

    describe('#getNetworkState', function () {
      it('should return "loading" when new', function () {
        const networkState = networkController.getNetworkState();
        assert.equal(networkState, 'loading', 'network is loading');
      });
    });

    describe('#setNetworkState', function () {
      it('should update the network', function () {
        networkController.setNetworkState('1');
        const networkState = networkController.getNetworkState();
        assert.equal(networkState, '1', 'network is 1');
      });
    });

    describe('#setProviderType', function () {
      it('should update provider.type', function () {
        networkController.initializeProvider(networkControllerProviderConfig);
        networkController.setProviderType('mainnet');
        const { type } = networkController.getProviderConfig();
        assert.equal(type, 'mainnet', 'provider type is updated');
      });

      it('should set the network to loading', function () {
        networkController.initializeProvider(networkControllerProviderConfig);

        const spy = sinon.spy(networkController, 'setNetworkState');
        networkController.setProviderType('mainnet');

        assert.equal(
          spy.callCount,
          1,
          'should have called setNetworkState 2 times',
        );
        assert.ok(
          spy.calledOnceWithExactly('loading'),
          'should have called with "loading" first',
        );
      });
    });

    describe('#getEIP1559Compatibility', function () {
      it('should return false when baseFeePerGas is not in the block header', async function () {
        networkController.initializeProvider(networkControllerProviderConfig);
        const supportsEIP1559 = await networkController.getEIP1559Compatibility();
        assert.equal(supportsEIP1559, false);
      });

      it('should return true when baseFeePerGas is in block header', async function () {
        networkController.initializeProvider(networkControllerProviderConfig);
        getLatestBlockStub.callsFake(() =>
          Promise.resolve({ baseFeePerGas: '0xa ' }),
        );
        const supportsEIP1559 = await networkController.getEIP1559Compatibility();
        assert.equal(supportsEIP1559, true);
      });

      it('should store EIP1559 support in state to reduce calls to getLatestBlock', async function () {
        networkController.initializeProvider(networkControllerProviderConfig);
        getLatestBlockStub.callsFake(() =>
          Promise.resolve({ baseFeePerGas: '0xa ' }),
        );
        await networkController.getEIP1559Compatibility();
        const supportsEIP1559 = await networkController.getEIP1559Compatibility();
        assert.equal(getLatestBlockStub.calledOnce, true);
        assert.equal(supportsEIP1559, true);
      });

      it('should clear stored EIP1559 support when changing networks', async function () {
        networkController.initializeProvider(networkControllerProviderConfig);
        networkController.consoleThis = true;
        getLatestBlockStub.callsFake(() =>
          Promise.resolve({ baseFeePerGas: '0xa ' }),
        );
        await networkController.getEIP1559Compatibility();
        assert.equal(
          networkController.networkDetails.getState().EIPS[1559],
          true,
        );
        getLatestBlockStub.callsFake(() => Promise.resolve({}));
        await setProviderTypeAndWait('mainnet');
        assert.equal(
          networkController.networkDetails.getState().EIPS[1559],
          undefined,
        );
        await networkController.getEIP1559Compatibility();
        assert.equal(
          networkController.networkDetails.getState().EIPS[1559],
          false,
        );
        assert.equal(getLatestBlockStub.calledTwice, true);
      });
    });
  });

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
      ];

      tests.forEach(({ input, expected }) =>
        assert.equal(getNetworkDisplayName(input), expected),
      );
    });
  });
});
