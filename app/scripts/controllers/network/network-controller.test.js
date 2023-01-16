import sinon from 'sinon';
import nock from 'nock';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import NetworkController, { NETWORK_EVENTS } from './network-controller';

const getNetworkDisplayName = (key) => NETWORK_TO_NAME_MAP[key];

/**
 * Construct a successful RPC response.
 *
 * @param {any} result - The RPC result to return.
 * @returns A successful RPC response with the specified result.
 */
function constructSuccessfulRpcResponse(result) {
  return {
    id: 1,
    jsonrpc: '2.0',
    result,
  };
}

// Example block taken from Ethereum Mainnet
const BLOCK = {
  baseFeePerGas: '0x63c498a46',
  difficulty: '0x0',
  extraData: '0x',
  gasLimit: '0x1c9c380',
  gasUsed: '0x598c9b',
  hash: '0xfb2086eb924ffce4061f94c3b65f303e0351f8e7deff185fe1f5e9001ff96f63',
  logsBloom:
    '0x7034820113921800018e8070900006316040002225c04a0624110010841018a2109040401004112a4c120f00220a2119020000714b143a04004106120130a8450080433129401068ed22000a54a48221a1020202524204045421b883882530009a1800b08a1309408008828403010d530440001a40003c0006240291008c0404c211610c690b00f1985e000009c02503240040010989c01cf2806840043815498e90012103e06084051542c0094002494008044c24a0a13281e0009601481073010800130402464202212202a8088210442a8ec81b080430075629e60a00a082005a3988400940a4009012a204011a0018a00903222a60420428888144210802',
  miner: '0xffee087852cb4898e6c3532e776e68bc68b1143b',
  mixHash: '0xb17ba50cd7261e77a213fb75704dcfd8a28fbcd78d100691a112b7cc2893efa2',
  nonce: '0x0000000000000000',
  number: '0x2', // number set to "2" to simplify tests
  parentHash:
    '0x31406d1bf1a2ca12371ce5b3ecb20568d6a8b9bf05b49b71b93ba33f317d5a82',
  receiptsRoot:
    '0x5ba97ece1afbac2a8fe0344f9022fe808342179b26ea3ecc2e0b8c4b46b7f8cd',
  sha3Uncles:
    '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
  size: '0x70f4',
  stateRoot:
    '0x36bfb7ca106d41c4458292669126e091011031c5af612dee1c2e6424ef92b080',
  timestamp: '0x639b6d9b',
  totalDifficulty: '0xc70d815d562d3cfa955',
  transactions: [
    // reduced to a single transaction to make fixture less verbose
    '0x2761e939dc822f64141bd00bc7ef8cee16201af10e862469212396664cee81ce',
  ],
  transactionsRoot:
    '0x98bbdfbe1074bc3aa72a77a281f16d6ba7e723d68f15937d80954fb34d323369',
  uncles: [],
};

describe('NetworkController', () => {
  describe('controller', () => {
    let networkController;
    let getLatestBlockStub;
    let setProviderTypeAndWait;

    beforeEach(() => {
      networkController = new NetworkController({ infuraProjectId: 'foo' });
      getLatestBlockStub = sinon
        .stub(networkController, '_getLatestBlock')
        .callsFake(() => Promise.resolve({}));
      setProviderTypeAndWait = () =>
        new Promise((resolve) => {
          networkController.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, () => {
            resolve();
          });
          networkController.setProviderType('mainnet');
        });
    });

    afterEach(() => {
      getLatestBlockStub.reset();
      networkController.destroy();
      nock.cleanAll();
    });

    describe('#provider', () => {
      it('provider should be updatable without reassignment', async () => {
        await networkController.initializeProvider();
        const providerProxy =
          networkController.getProviderAndBlockTracker().provider;
        expect(providerProxy.test).toBeUndefined();
        providerProxy.setTarget({ test: true });
        expect(providerProxy.test).toStrictEqual(true);
      });
    });

    describe('destroy', () => {
      it('should not throw if called before initialization', async () => {
        await expect(
          async () => await networkController.destroy(),
        ).not.toThrow();
      });

      it('should stop the block tracker for the current selected network', async () => {
        nock('http://localhost:8545')
          .persist()
          .post(/.*/u)
          .reply(200, () =>
            JSON.stringify(constructSuccessfulRpcResponse(BLOCK)),
          );
        await networkController.initializeProvider();
        const { blockTracker } = networkController.getProviderAndBlockTracker();
        // The block tracker starts running after a listener is attached
        blockTracker.addListener('latest', () => {
          // do nothing
        });
        expect(blockTracker.isRunning()).toBe(true);

        networkController.destroy();

        expect(blockTracker.isRunning()).toBe(false);
      });
    });

    describe('#getNetworkState', () => {
      it('should return "loading" when new', () => {
        const networkState = networkController.getNetworkState();
        expect(networkState).toStrictEqual('loading');
      });
    });

    describe('#setProviderType', () => {
      it('should update provider.type', async () => {
        await networkController.initializeProvider();
        networkController.setProviderType('mainnet');
        const { type } = networkController.getProviderConfig();
        expect(type).toStrictEqual('mainnet');
      });

      it('should set the network to loading', async () => {
        await networkController.initializeProvider();

        const spy = sinon.spy(networkController, '_setNetworkState');
        networkController.setProviderType('mainnet');

        expect(spy.callCount).toStrictEqual(1);
        expect(spy.calledOnceWithExactly('loading')).toStrictEqual(true);
      });
    });

    describe('#getEIP1559Compatibility', () => {
      it('should return false when baseFeePerGas is not in the block header', async () => {
        await networkController.initializeProvider();
        const supportsEIP1559 =
          await networkController.getEIP1559Compatibility();
        expect(supportsEIP1559).toStrictEqual(false);
      });

      it('should return true when baseFeePerGas is in block header', async () => {
        await networkController.initializeProvider();
        getLatestBlockStub.callsFake(() =>
          Promise.resolve({ baseFeePerGas: '0xa ' }),
        );
        const supportsEIP1559 =
          await networkController.getEIP1559Compatibility();
        expect(supportsEIP1559).toStrictEqual(true);
      });

      it('should store EIP1559 support in state to reduce calls to _getLatestBlock', async () => {
        await networkController.initializeProvider();
        getLatestBlockStub.callsFake(() =>
          Promise.resolve({ baseFeePerGas: '0xa ' }),
        );
        await networkController.getEIP1559Compatibility();
        const supportsEIP1559 =
          await networkController.getEIP1559Compatibility();
        expect(getLatestBlockStub.calledOnce).toStrictEqual(true);
        expect(supportsEIP1559).toStrictEqual(true);
      });

      it('should clear stored EIP1559 support when changing networks', async () => {
        await networkController.initializeProvider();
        getLatestBlockStub.callsFake(() =>
          Promise.resolve({ baseFeePerGas: '0xa ' }),
        );
        await networkController.getEIP1559Compatibility();
        expect(
          networkController.networkDetails.getState().EIPS[1559],
        ).toStrictEqual(true);
        getLatestBlockStub.callsFake(() => Promise.resolve({}));
        await setProviderTypeAndWait('mainnet');
        expect(
          networkController.networkDetails.getState().EIPS[1559],
        ).toBeUndefined();
        await networkController.getEIP1559Compatibility();
        expect(
          networkController.networkDetails.getState().EIPS[1559],
        ).toStrictEqual(false);
        expect(getLatestBlockStub.calledTwice).toStrictEqual(true);
      });
    });
  });

  describe('utils', () => {
    it('getNetworkDisplayName should return the correct network name', () => {
      const tests = [
        {
          input: 'mainnet',
          expected: 'Ethereum Mainnet',
        },
        {
          input: 'goerli',
          expected: 'Goerli',
        },
        {
          input: 'sepolia',
          expected: 'Sepolia',
        },
      ];

      tests.forEach(({ input, expected }) =>
        expect(getNetworkDisplayName(input)).toStrictEqual(expected),
      );
    });
  });
});
