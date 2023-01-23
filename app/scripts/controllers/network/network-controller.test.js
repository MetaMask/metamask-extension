import nock from 'nock';
import { deferredPromise } from '../../lib/util';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import NetworkController, { NETWORK_EVENTS } from './network-controller';

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

// Example block taken from Ethereum Mainnet that has been updated to match the
// pre-EIP-1559 format (i.e. it doesn't have the `baseFeePerGas` property).
const PRE_1559_BLOCK = {
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
// Example block taken from Ethereum Mainnet post-EIP-1559
const BLOCK = {
  ...PRE_1559_BLOCK,
  baseFeePerGas: '0x63c498a46',
};

const defaultControllerOptions = {
  infuraProjectId: 'foo',
};

/**
 * Builds a controller based on the given options, and calls the given function
 * with that controller.
 *
 * @param args - Either a function, or constructor options + a function. The
 * function will be called with the built controller.
 * @returns Whatever the callback returns.
 */
async function withController(...args) {
  const [constructorArgs, fn] = args.length === 2 ? args : [{}, args[0]];
  const controller = new NetworkController({
    ...defaultControllerOptions,
    ...constructorArgs,
  });
  try {
    return await fn({ controller });
  } finally {
    await controller.destroy();
  }
}

/**
 * Setup Nock mocks for the block tracker.
 *
 * @param {object} options - Options.
 * @param {NETWORK_TYPES} options.networkType - The network type to mock.
 * @param {object} options.block - The mock block to return.
 * @param {Record<string, number>} options.requests - A set of methods to setup
 * mocks for, mapped to the number of times to expect each request.
 */
function setupMockRpcBlockResponses({
  networkType = NetworkController.defaultProviderConfig.type,
  block = BLOCK,
  requests = { eth_getBlockByNumber: 1, eth_blockNumber: 1 },
} = {}) {
  const rpcUrl =
    networkType === NETWORK_TYPES.RPC
      ? 'http://localhost:8545/'
      : `https://${networkType}.infura.io/v3/${defaultControllerOptions.infuraProjectId}`;
  const { origin, pathname } = new URL(rpcUrl);

  const scope = nock(origin);

  if (requests.eth_getBlockByNumber) {
    scope
      .post(
        pathname,
        (body) =>
          body.method === 'eth_getBlockByNumber' &&
          body.params[0] === block.number,
      )
      .times(requests.eth_getBlockByNumber)
      .reply(200, () => JSON.stringify(constructSuccessfulRpcResponse(block)));
  }
  if (requests.eth_blockNumber) {
    scope
      .post(pathname, (body) => body.method === 'eth_blockNumber')
      .times(requests.eth_blockNumber)
      .reply(200, () =>
        JSON.stringify(constructSuccessfulRpcResponse(block.number)),
      );
  }
}

describe('NetworkController', () => {
  describe('controller', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    describe('#provider', () => {
      it('provider should be updatable without reassignment', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses();
          await controller.initializeProvider();
          const providerProxy =
            controller.getProviderAndBlockTracker().provider;
          expect(providerProxy.test).toBeUndefined();

          providerProxy.setTarget({ test: true });

          expect(providerProxy.test).toStrictEqual(true);
        });
      });
    });

    describe('destroy', () => {
      it('should not throw if called before initialization', async () => {
        const controller = new NetworkController(defaultControllerOptions);
        await expect(controller.destroy()).resolves.toBe(undefined);
      });

      it('should stop the block tracker for the current selected network', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses();
          await controller.initializeProvider();
          const { blockTracker } = controller.getProviderAndBlockTracker();
          // The block tracker starts running after a listener is attached
          blockTracker.addListener('latest', () => {
            // do nothing
          });
          expect(blockTracker.isRunning()).toBe(true);

          await controller.destroy();

          expect(blockTracker.isRunning()).toBe(false);
        });
      });
    });

    describe('#getNetworkState', () => {
      it('should return "loading" when uninitialized', async () => {
        await withController(async ({ controller }) => {
          const networkState = controller.getNetworkState();
          expect(networkState).toStrictEqual('loading');
        });
      });
    });

    describe('#setProviderType', () => {
      it('should update provider.type', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses({ networkType: NETWORK_TYPES.RPC });
          setupMockRpcBlockResponses({ networkType: NETWORK_TYPES.MAINNET });
          await controller.initializeProvider();
          controller.setProviderType('mainnet');
          const { type } = controller.getProviderConfig();
          expect(type).toStrictEqual('mainnet');
        });
      });

      it('should set the network to loading', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses({ networkType: NETWORK_TYPES.RPC });
          setupMockRpcBlockResponses({ networkType: NETWORK_TYPES.MAINNET });
          await controller.initializeProvider();

          controller.setProviderType('mainnet');
          const { promise: networkIdChanged, resolve } = deferredPromise();
          controller.networkStore.subscribe(resolve);

          expect(controller.networkStore.getState()).toBe('loading');
          await networkIdChanged;
          expect(controller.networkStore.getState()).toBe('1');
        });
      });
    });

    describe('#getEIP1559Compatibility', () => {
      it('should return false when baseFeePerGas is not in the block header', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses({ block: PRE_1559_BLOCK });
          await controller.initializeProvider();
          const supportsEIP1559 = await controller.getEIP1559Compatibility();
          expect(supportsEIP1559).toStrictEqual(false);
        });
      });

      it('should return true when baseFeePerGas is in block header', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses();
          await controller.initializeProvider();
          const supportsEIP1559 = await controller.getEIP1559Compatibility();
          expect(supportsEIP1559).toStrictEqual(true);
        });
      });

      it('should store EIP1559 support in state to reduce calls to _getLatestBlock', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses();
          await controller.initializeProvider();
          await controller.getEIP1559Compatibility();
          const supportsEIP1559 = await controller.getEIP1559Compatibility();
          expect(supportsEIP1559).toStrictEqual(true);
        });
      });

      it('should clear stored EIP1559 support when changing networks', async () => {
        await withController(async ({ controller }) => {
          setupMockRpcBlockResponses({ networkType: NETWORK_TYPES.RPC });
          setupMockRpcBlockResponses({
            networkType: NETWORK_TYPES.MAINNET,
            block: PRE_1559_BLOCK,
            requests: {
              eth_blockNumber: 2,
              eth_getBlockByNumber: 1,
            },
          });
          await controller.initializeProvider();
          await controller.getEIP1559Compatibility();
          expect(controller.networkDetails.getState().EIPS[1559]).toStrictEqual(
            true,
          );
          await new Promise((resolve) => {
            controller.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, () => {
              resolve();
            });
            controller.setProviderType('mainnet');
          });
          expect(
            controller.networkDetails.getState().EIPS[1559],
          ).toBeUndefined();
          await controller.getEIP1559Compatibility();
          expect(controller.networkDetails.getState().EIPS[1559]).toStrictEqual(
            false,
          );
        });
      });
    });
  });
});
