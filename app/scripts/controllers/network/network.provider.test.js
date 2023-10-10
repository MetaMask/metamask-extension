/**
 * @jest-environment node
 */

import EthQuery from 'eth-query';
import { addHexPrefix, privateToAddress } from 'ethereumjs-util';
import { personalSign } from 'eth-sig-util';
import nock from 'nock';
import sinon from 'sinon';
import NetworkController from './network';

// const INFURA_PROJECT_ID = '591f0dce1c6d4316aad895d1716a47f7';
const INFURA_PROJECT_ID = 'abc123';
const LATEST_BLOCK_NUMBER = '0x42';
const originalSetTimeout = global.setTimeout;
const REQUEST_RETRY_DELAY = 1000;

function mockSuccessfulRpcCallToInfura({
  scope,
  rpcRequest,
  rpcResponse,
  rawResponse,
}) {
  const { method, params = [], ...rest } = rpcRequest;
  const response = rawResponse ?? {
    id: 1,
    jsonrpc: '2.0',
    ...rpcResponse,
  };
  return scope
    .post(`/v3/${INFURA_PROJECT_ID}`, {
      jsonrpc: '2.0',
      method,
      params,
      ...rest,
    })
    .reply(200, response);
}

function mockArbitraryRpcCallToInfura({ scope }) {
  return scope.post(`/v3/${INFURA_PROJECT_ID}`, {
    jsonrpc: '2.0',
    method: 'arbitraryRpcMethod',
    params: [],
  });
}

function makeRpcCall({ ethQuery, rpcRequest }) {
  const { method, params = [], ...rest } = rpcRequest;
  return new Promise((resolve, reject) => {
    ethQuery.sendAsync({ method, params, ...rest }, (error, result) => {
      console.log('error', error, 'result', result);
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

function callArbitraryRpcMethod({ ethQuery }) {
  return makeRpcCall({
    ethQuery,
    rpcRequest: { method: 'arbitraryRpcMethod' },
  });
}

function buildScopeForMockingInfuraRequests({ network = 'mainnet' } = {}) {
  return nock(`https://${network}.infura.io`).filteringRequestBody((body) => {
    const copyOfBody = JSON.parse(body);
    // some ids are random, so remove them entirely from the request to
    // make it possible to mock these requests
    delete copyOfBody.id;
    return JSON.stringify(copyOfBody);
  });
}

/**
 * Mock requests that occur within NetworkController when it is making sure
 * that Infura is available.
 *
 * @param scope - A nock scope.
 */
function mockInfuraRequestsForProbes(scope) {
  return mockSuccessfulRpcCallToInfura({
    scope,
    rpcRequest: { method: 'eth_blockNumber', params: [] },
    rpcResponse: { result: LATEST_BLOCK_NUMBER },
  });
}

/**
 * Mock requests that occur within NetworkController when the block tracker is
 * first started. (Requests that occur when the block tracker is running do not
 * occur thanks to mocking timers.)
 *
 * @param scope - A nock scope.
 */
function mockInfuraRequestsForPollingBlockTracker(scope) {
  return mockSuccessfulRpcCallToInfura({
    scope,
    rpcRequest: { method: 'eth_blockNumber', params: [] },
    rpcResponse: { result: LATEST_BLOCK_NUMBER },
  });
}

/**
 * Mock default requests that occur within NetworkController when it is
 * initialized.
 *
 * @param options - The options.
 * @param options.network - The Infura network.
 * @returns The nock scope.
 */
function mockInitialRequestsToInfura({ network = 'mainnet' } = {}) {
  const scope = buildScopeForMockingInfuraRequests({ network });
  mockInfuraRequestsForProbes(scope);
  mockInfuraRequestsForPollingBlockTracker(scope);
  return scope;
}

/**
 * Builds a NetworkController, runs the given function, and then destroys the
 * NetworkController.
 *
 * @param {...any} args
 */
async function withConnectionToInfuraNetwork(...args) {
  const fn = args.pop();
  const opts = args[0] ?? {};
  const network = opts.network ?? 'mainnet';
  const providerParams = opts.providerParams ?? {};
  const controller = new NetworkController({
    provider: {
      type: network,
    },
  });
  controller.setInfuraProjectId(INFURA_PROJECT_ID);
  controller.initializeProvider({
    getAccounts() {
      // intentionally left blank
    },
    ...providerParams,
  });
  const { provider } = controller.getProviderAndBlockTracker();
  const ethQuery = new EthQuery(provider);
  let result;
  try {
    result = await fn({ controller, provider, ethQuery });
  } finally {
    await controller.destroy();
  }
  return result;
}

/**
 * The request logic in the Infura middleware uses `setTimeout` to sleep before
 * retry, so this skips through those `setTimeout`s.
 *
 * @param clock
 */
async function skipThroughSleepsBeforeRequestRetries(clock) {
  let numTimersRun = 0;
  while (numTimersRun < 4) {
    const numTimers = Object.values(clock.timers).filter(
      (timer) => timer.delay === REQUEST_RETRY_DELAY,
    ).length;

    if (numTimers === 0) {
      console.log('Waiting for setTimeout to appear...');
      await new Promise((resolve) => originalSetTimeout(resolve, 50));
    } else {
      console.log(`${numTimers} setTimeout(s) appeared! Running them now...`);
      clock.runAll();
      numTimersRun += numTimers;
      console.log(`${numTimersRun} timer(s) have now been run`);
    }
  }

  console.log('4 timers were run, all done!');

  if (Object.values(clock.timers).length > 0) {
    console.log('There are still some timers lying around, running them now');
    clock.runAll();
  }

  // If the block tracker is waiting to go to the next iteration, proceed
  // clock.runAll();

  // for (let i = 0; i < 5; i++) {
  // console.log(`awaiting next timer (${i + 1} / 5)`);
  // await clock.nextAsync();
  // console.log(`done awaiting next timer (${i + 1} / 5)`);
  // }

  // If the block tracker is waiting to go to the next iteration, proceed
  // clock.runAll();
}

describe('NetworkController provider tests', () => {
  // let nockCallObjects;

  // beforeEach(() => {
  // nockCallObjects = nock.recorder.rec({
  // dont_print: true,
  // output_objects: true,
  // });
  // });

  afterEach(() => {
    // console.log(nockCallObjects);
    // console.log('checking to make sure all pending requests are satisfied');
    nock.isDone();
    nock.cleanAll();
  });

  describe('if NetworkController is configured with an Infura network', () => {
    let clock;

    beforeEach(() => {
      /*
      const originalSetTimeout = global.setTimeout;
      // Stub setTimeout so that request retries occur faster
      jest.spyOn(global, 'setTimeout').mockImplementation((fn, _timeout) => {
        return originalSetTimeout(fn, 100);
      });
      */

      // This ends up doing two things:
      //
      // 1. Halting the block tracker (which depends on `setTimeout` to
      //    periodically request the latest block) set up in
      //    `eth-json-rpc-middleware`
      // 2. Halting the retry logic in `eth-json-rpc-infura` (which also depends
      //    on `setTimeout`)

      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    // -----------
    // MetaMask middleware
    // (app/scripts/controllers/network/createMetamaskMiddleware.js)
    // -----------

    // Scaffold middleware

    describe('when the RPC method is "eth_syncing"', () => {
      it('returns a static result', async () => {
        mockInitialRequestsToInfura();

        const result = await withConnectionToInfuraNetwork(({ ethQuery }) => {
          return makeRpcCall({
            ethQuery,
            rpcRequest: { method: 'eth_syncing' },
          });
        });

        expect(result).toBe(false);
      });
    });

    describe('when the RPC method is "web3_clientVersion"', () => {
      it('returns a static result', async () => {
        mockInitialRequestsToInfura();

        const result = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              version: '1.0.0',
            },
          },
          ({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: { method: 'web3_clientVersion' },
            });
          },
        );

        expect(result).toStrictEqual('MetaMask/v1.0.0');
      });
    });

    // Wallet middleware
    // (eth-json-rpc-middleware -> createWalletMiddleware)

    describe('when the RPC method is "eth_accounts"', () => {
      it('returns the result of getAccounts', async () => {
        const accounts = ['0x1', '0x2'];
        mockInitialRequestsToInfura();

        const result = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              async getAccounts() {
                return accounts;
              },
            },
          },
          ({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: { method: 'eth_accounts' },
            });
          },
        );

        expect(result).toStrictEqual(accounts);
      });
    });

    describe('when the RPC method is "eth_coinbase"', () => {
      it('returns the first account obtained via the given getAccounts function', async () => {
        const accounts = ['0x1', '0x2'];
        mockInitialRequestsToInfura();

        const result = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              async getAccounts() {
                return accounts;
              },
            },
          },
          ({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: { method: 'eth_coinbase' },
            });
          },
        );

        expect(result).toStrictEqual('0x1');
      });
    });

    describe('when the RPC method is "eth_sendTransaction"', () => {
      describe('when configured with a processTransaction function', () => {
        it('returns the result of processTransaction, passing it a normalized version of the RPC params', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processTransaction(params) {
                  return params;
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_sendTransaction',
                  params: [
                    {
                      from: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                      to: '0xDEF456',
                      value: '0x12345',
                    },
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            from: '0xabcdef1234567890abcdef1234567890abcdef12',
            to: '0xDEF456',
            value: '0x12345',
          });
        });
      });

      describe('when not configured with a processTransaction function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_sendTransaction',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "eth_signTransaction"', () => {
      it('does not support it because it does not pass a processSignTransaction function to createWalletMiddleware, even though createWalletMiddleware supports it', async () => {
        mockInitialRequestsToInfura();

        const promise = withConnectionToInfuraNetwork(
          {
            providerParams: {
              async processSignTransaction(params) {
                return params;
              },
            },
          },
          ({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_signTransaction',
                params: [
                  { from: '0xABC123', to: '0xDEF456', value: '0x12345' },
                ],
              },
            });
          },
        );

        await expect(promise).rejects.toThrow('Method not supported.');
      });
    });

    describe('when the RPC method is "eth_sign"', () => {
      describe('when configured with a processEthSignMessage function', () => {
        it('delegates to processEthSignMessage, passing a processed version of the RPC params', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processEthSignMessage(params) {
                  return params;
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_sign',
                  params: [
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    'this is the message',
                    { extra: 'params' },
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            from: '0xabcdef1234567890abcdef1234567890abcdef12',
            data: 'this is the message',
            extra: 'params',
          });
        });
      });

      describe('when not configured with a processTransaction function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_sign',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "eth_signTypedData"', () => {
      describe('when configured with a processTypedMessage function', () => {
        it('delegates to the given processTypedMessage function, passing a processed version of the RPC params and a version', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processTypedMessage(params, _req, version) {
                  return { params, version };
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_signTypedData',
                  params: [
                    'this is the message',
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    { extra: 'params' },
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            params: {
              from: '0xabcdef1234567890abcdef1234567890abcdef12',
              data: 'this is the message',
              extra: 'params',
            },
            version: 'V1',
          });
        });
      });

      describe('when not configured with a processTypedMessage function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_signTypedData',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "eth_signTypedData_v3"', () => {
      describe('when configured with a processTypedMessageV3 function', () => {
        it('delegates to processTypedMessageV3, passing a processed version of the RPC params and a version', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processTypedMessageV3(params, _req, version) {
                  return { params, version };
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_signTypedData_v3',
                  params: [
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    'this is the message',
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            params: {
              from: '0xabcdef1234567890abcdef1234567890abcdef12',
              data: 'this is the message',
              version: 'V3',
            },
            version: 'V3',
          });
        });
      });

      describe('when not configured with a processTypedMessageV3 function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_signTypedData_v3',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "eth_signTypedData_v4"', () => {
      describe('when configured with a processTypedMessageV4 function', () => {
        it('delegates to processTypedMessageV4, passing a processed version of the RPC params and a version', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processTypedMessageV4(params, _req, version) {
                  return { params, version };
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_signTypedData_v4',
                  params: [
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    'this is the message',
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            params: {
              from: '0xabcdef1234567890abcdef1234567890abcdef12',
              data: 'this is the message',
              version: 'V4',
            },
            version: 'V4',
          });
        });
      });

      describe('when not configured with a processTypedMessageV4 function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_signTypedData_v4',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "personal_sign"', () => {
      describe('when configured with a processPersonalMessage function', () => {
        it('delegates to the given processPersonalMessage function, passing a processed version of the RPC params', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processPersonalMessage(params) {
                  return params;
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'personal_sign',
                  params: [
                    'this is the message',
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    { extra: 'params' },
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            from: '0xabcdef1234567890abcdef1234567890abcdef12',
            data: 'this is the message',
            extra: 'params',
          });
        });

        it('also accepts RPC params in the order [address, message] for backward compatibility', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processPersonalMessage(params) {
                  return params;
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'personal_sign',
                  params: [
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    'this is the message',
                    { extra: 'params' },
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            from: '0xabcdef1234567890abcdef1234567890abcdef12',
            data: 'this is the message',
            extra: 'params',
          });
        });
      });

      describe('when not configured with a processPersonalMessage function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'personal_sign',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "eth_getEncryptionPublicKey"', () => {
      describe('when configured with a processEncryptionPublicKey function', () => {
        it('delegates to processEncryptionPublicKey, passing the address in the RPC params', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processEncryptionPublicKey(address) {
                  return address;
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_getEncryptionPublicKey',
                  params: [
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    '0xABC123',
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual(
            '0xabcdef1234567890abcdef1234567890abcdef12',
          );
        });
      });

      describe('when not configured with a processEncryptionPublicKey function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_getEncryptionPublicKey',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "eth_decrypt"', () => {
      describe('when configured with a processDecryptMessage function', () => {
        it('delegates to the given processDecryptMessage function, passing a processed version of the RPC params', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                async getAccounts() {
                  return ['0xabcdef1234567890abcdef1234567890abcdef12'];
                },
                async processDecryptMessage(params) {
                  return params;
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_decrypt',
                  params: [
                    'this is the message',
                    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    { extra: 'params' },
                  ],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            from: '0xabcdef1234567890abcdef1234567890abcdef12',
            data: 'this is the message',
            extra: 'params',
          });
        });
      });

      describe('when not configured with a processDecryptMessage function', () => {
        it('throws a "method not found" error', async () => {
          mockInitialRequestsToInfura();

          const promise = withConnectionToInfuraNetwork(({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_decrypt',
              },
            });
          });

          await expect(promise).rejects.toThrow('Method not supported.');
        });
      });
    });

    describe('when the RPC method is "personal_ecRecover"', () => {
      it("returns the result of eth-sig-util's recoverPersonalSignature function, passing it a processed version of the RPC params", async () => {
        mockInitialRequestsToInfura();
        const privateKey = Buffer.from(
          'ea54bdc52d163f88c93ab0615782cf718a2efb9e51a7989aab1b08067e9c1c5f',
          'hex',
        );
        const message = addHexPrefix(
          Buffer.from('Hello, world!').toString('hex'),
        );
        const signature = personalSign(privateKey, { data: message });
        const address = addHexPrefix(
          privateToAddress(privateKey).toString('hex'),
        );

        const result = await withConnectionToInfuraNetwork(({ ethQuery }) => {
          return makeRpcCall({
            ethQuery,
            rpcRequest: {
              method: 'personal_ecRecover',
              params: [message, signature, { extra: 'params' }],
            },
          });
        });

        expect(result).toStrictEqual(address);
      });
    });

    // Pending nonce middleware
    // (app/scripts/controllers/network/middleware/pending.js)

    describe('when the RPC method is "eth_getTransactionCount" and the block param is "pending"', () => {
      it('returns the result of the given getPendingNonce function', async () => {
        mockInitialRequestsToInfura();

        const result = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              async getPendingNonce(param) {
                return { param, blockNumber: '0x2' };
              },
            },
          },
          ({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_getTransactionCount',
                params: ['0xabc123', 'pending'],
              },
            });
          },
        );

        expect(result).toStrictEqual({ param: '0xabc123', blockNumber: '0x2' });
      });
    });

    // Pending transactions middleware
    // (app/scripts/controllers/network/middleware/pending.js)

    describe('when the RPC method is "eth_getTransactionByHash"', () => {
      describe('assuming that the given getPendingTransactionByHash function returns a (pending) EIP-1559 transaction', () => {
        it('delegates to getPendingTransactionByHash, using a standardized version of the transaction as the result', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                getPendingTransactionByHash(_hash) {
                  return {
                    txParams: {
                      maxFeePerGas: '0x174876e800',
                      maxPriorityFeePerGas: '0x3b9aca00',
                    },
                  };
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_getTransactionByHash',
                  params: ['0x999'],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            v: undefined,
            r: undefined,
            s: undefined,
            to: undefined,
            gas: undefined,
            from: undefined,
            hash: undefined,
            nonce: undefined,
            input: '0x',
            value: '0x0',
            accessList: null,
            blockHash: null,
            blockNumber: null,
            transactionIndex: null,
            gasPrice: '0x174876e800',
            maxFeePerGas: '0x174876e800',
            maxPriorityFeePerGas: '0x3b9aca00',
            type: '0x2',
          });
        });
      });

      describe('assuming that the given getPendingTransactionByHash function returns a (pending) non-EIP-1559 transaction', () => {
        it('delegates to getPendingTransactionByHash, using a standardized, type-0 version of the transaction as the result', async () => {
          mockInitialRequestsToInfura();

          const result = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                getPendingTransactionByHash(_hash) {
                  return {
                    txParams: {
                      gasPrice: '0x174876e800',
                    },
                  };
                },
              },
            },
            ({ ethQuery }) => {
              return makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method: 'eth_getTransactionByHash',
                  params: ['0x999'],
                },
              });
            },
          );

          expect(result).toStrictEqual({
            v: undefined,
            r: undefined,
            s: undefined,
            to: undefined,
            gas: undefined,
            from: undefined,
            hash: undefined,
            nonce: undefined,
            input: '0x',
            value: '0x0',
            accessList: null,
            blockHash: null,
            blockNumber: null,
            transactionIndex: null,
            gasPrice: '0x174876e800',
            type: '0x0',
          });
        });
      });

      // (the "getPendingTransactionByHash returns nothing" case is tested below)
    });

    // -----------
    // Network middleware
    // (app/scripts/controllers/network/createInfuraClient.js)
    // -----------

    // Network and chain id middleware

    describe('when the RPC method is "eth_chainId"', () => {
      it('does not hit Infura, instead returning the chain id that maps to the Infura network, as a hex string', async () => {
        const network = 'ropsten';
        mockInitialRequestsToInfura({ network });

        const chainId = await withConnectionToInfuraNetwork(
          { network },
          ({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'eth_chainId',
              },
            });
          },
        );

        expect(chainId).toStrictEqual('0x3');
      });
    });

    describe('when the RPC method is "net_version"', () => {
      it('does not hit Infura, instead returning the chain id that maps to the Infura network, as a decimal string', async () => {
        const network = 'ropsten';
        mockInitialRequestsToInfura({ network });

        const netVersion = await withConnectionToInfuraNetwork(
          { network },
          ({ ethQuery }) => {
            return makeRpcCall({
              ethQuery,
              rpcRequest: {
                method: 'net_version',
              },
            });
          },
        );

        expect(netVersion).toStrictEqual('3');
      });
    });

    // --- Block cache middleware ---

    // Things to do:
    //
    // * Make sure that no RPC methods are duplicated. To do that, reorganize
    //   this entire file by RPC method
    // * Make sure that the "remove blocks before X" logic in block-cache is
    //   tested (esp. around what happens if the latest block number is lower)

    // The list of cacheable RPC methods listed below are taken from
    // `eth-json-rpc-middleware` -> `cacheTypeForPayload`. Out of these methods,
    // the ones listed in `blockTagParamIndex` have special behavior, and these
    // are marked with a `(0)`, `(1)`, or `(2)`, depending on whether the RPC
    // method takes a block tag in the 0th, 1st, or 2nd position among its
    // arguments.
    //
    // - eth_blockNumber ✅
    // - eth_call (1)
    // - eth_compileLLL ✅
    // - eth_compileSerpent ✅
    // - eth_compileSolidity ✅
    // - eth_estimateGas ✅
    // - eth_gasPrice ✅
    // - eth_getBalance (1)
    // - eth_getBlockByHash ✅
    // - eth_getBlockByNumber (0)
    // - eth_getBlockTransactionCountByHash ✅
    // - eth_getBlockTransactionCountByNumber ✅
    // - eth_getCode (1)
    // - eth_getCompilers ✅
    // - eth_getFilterLogs ✅
    // - eth_getLogs ✅
    // - eth_getStorageAt (2)
    // - eth_getTransactionByBlockHashAndIndex ✅
    // - eth_getTransactionByBlockNumberAndIndex ✅
    // - eth_getTransactionByHash [not tested below, as it's tested above]
    // - eth_getTransactionCount (1) [not tested below for "pending", as it's tested above]
    // - eth_getTransactionReceipt ✅
    // - eth_getUncleByBlockHashAndIndex ✅
    // - eth_getUncleByBlockNumberAndIndex ✅
    // - eth_getUncleCountByBlockHash ✅
    // - eth_getUncleCountByBlockNumber ✅
    // - eth_protocolVersion ✅
    // - shh_version ✅
    // - test_blockCache ✅
    // - test_forkCache ✅
    // - test_permaCache ✅
    // - web3_clientVersion [not tested below, as it's tested above]
    // - web3_sha3

    // No block tag argument supported (always "latest")

    [
      'eth_blockNumber',
      'eth_compileLLL',
      'eth_compileSerpent',
      'eth_compileSolidity',
      'eth_estimateGas',
      'eth_gasPrice',
      'eth_getBlockByHash',
      'eth_getBlockTransactionCountByHash',
      'eth_getBlockTransactionCountByNumber',
      'eth_getCompilers',
      'eth_getFilterLogs',
      'eth_getLogs',
      'eth_getTransactionByBlockHashAndIndex',
      'eth_getTransactionByBlockNumberAndIndex',
      'eth_getUncleByBlockHashAndIndex',
      'eth_getUncleByBlockNumberAndIndex',
      'eth_getUncleCountByBlockHash',
      'eth_getUncleCountByBlockNumber',
      'eth_protocolVersion',
      'shh_version',
      'test_blockCache',
      'test_forkCache',
      'test_permaCache',
      'web3_sha3',
    ].forEach((method) => {
      describe(`when the RPC method is "${method}"`, () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('does not reuse the result of a previous call if the latest block number was updated prior to this call', async () => {
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });

        it('does not reuse the results of a previous call if it had different arguments', async () => {
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some other value'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some other value'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });
      });
    });

    // This is partially tested above, here we are adding caching-related tests
    describe(`when the RPC method is "eth_getTransactionByHash"`, () => {
      describe('if the given getPendingTransactionByHash function returns nothing', () => {
        describe('as long as a result returns a reasonable blockHash', () => {
          it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
            const method = 'eth_getTransactionByHash';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: { blockHash: '0x100' } },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: { blockHash: '0x200' } },
            });

            const results = await withConnectionToInfuraNetwork(
              {
                providerParams: {
                  getPendingTransactionByHash() {
                    return null;
                  },
                },
              },
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([
              { blockHash: '0x100' },
              { blockHash: '0x100' },
            ]);
          });

          it('does not reuse the result of a previous call if the latest block was updated prior to this call', async () => {
            const method = 'eth_getTransactionByHash';
            const scope = buildScopeForMockingInfuraRequests();
            mockInfuraRequestsForProbes(scope);
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x1' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: { blockHash: '0x100' } },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x2' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: { blockHash: '0x200' } },
            });

            const results = await withConnectionToInfuraNetwork(
              {
                providerParams: {
                  getPendingTransactionByHash() {
                    return null;
                  },
                },
              },
              async ({ ethQuery }) => {
                const firstResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                });
                // Proceed to the next iteration of the block tracker
                // so that a new block is fetched and the current block is updated
                clock.runAll();
                const secondResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                });
                return [firstResult, secondResult];
              },
            );

            expect(results).toStrictEqual([
              { blockHash: '0x100' },
              { blockHash: '0x200' },
            ]);
          });

          it('does not reuse the results of a previous call if it had different arguments', async () => {
            const method = 'eth_getTransactionByHash';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value'] },
              rpcResponse: { result: { blockHash: '0x100' } },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some other value'] },
              rpcResponse: { result: { blockHash: '0x200' } },
            });

            const results = await withConnectionToInfuraNetwork(
              {
                providerParams: {
                  getPendingTransactionByHash() {
                    return null;
                  },
                },
              },
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some other value'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([
              { blockHash: '0x100' },
              { blockHash: '0x200' },
            ]);
          });
        });

        it('does not cache a result if its returned blockHash is null', async () => {
          const method = 'eth_getTransactionByHash';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: { blockHash: null, extra: 'some value' } },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: {
              result: { blockHash: null, extra: 'some other value' },
            },
          });

          const results = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                getPendingTransactionByHash() {
                  return null;
                },
              },
            },
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
              ];
            },
          );

          expect(results).toStrictEqual([
            { blockHash: null, extra: 'some value' },
            { blockHash: null, extra: 'some other value' },
          ]);
        });

        it('does not cache a result if its returned blockHash is undefined', async () => {
          const method = 'eth_getTransactionByHash';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: {
              result: { blockHash: undefined, extra: 'some value' },
            },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: {
              result: { blockHash: undefined, extra: 'some other value' },
            },
          });

          const results = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                getPendingTransactionByHash() {
                  return null;
                },
              },
            },
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
              ];
            },
          );

          expect(results).toStrictEqual([
            { extra: 'some value' },
            { extra: 'some other value' },
          ]);
        });

        it('does not cache a result if its returned blockHash is "0x0000000000000000000000000000000000000000000000000000000000000000"', async () => {
          const method = 'eth_getTransactionByHash';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: {
              result: {
                blockHash:
                  '0x0000000000000000000000000000000000000000000000000000000000000000',
                extra: 'some value',
              },
            },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: {
              result: {
                blockHash:
                  '0x0000000000000000000000000000000000000000000000000000000000000000',
                extra: 'some other value',
              },
            },
          });

          const results = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                getPendingTransactionByHash() {
                  return null;
                },
              },
            },
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
              ];
            },
          );

          expect(results).toStrictEqual([
            {
              blockHash:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
              extra: 'some value',
            },
            {
              blockHash:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
              extra: 'some other value',
            },
          ]);
        });

        it('does not cache a result if it has no blockHash', async () => {
          const method = 'eth_getTransactionByHash';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: {
              result: { some: 'value' },
            },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: {
              result: { someOther: 'value' },
            },
          });

          const results = await withConnectionToInfuraNetwork(
            {
              providerParams: {
                getPendingTransactionByHash() {
                  return null;
                },
              },
            },
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
              ];
            },
          );

          expect(results).toStrictEqual([
            { some: 'value' },
            { someOther: 'value' },
          ]);
        });
      });
    });

    describe(`when the RPC method is "eth_getTransactionReceipt"`, () => {
      describe('as long as a result returns a reasonable blockHash', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getTransactionReceipt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: { blockHash: '0x100' } },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: { blockHash: '0x200' } },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
              ];
            },
          );

          expect(results).toStrictEqual([
            { blockHash: '0x100' },
            { blockHash: '0x100' },
          ]);
        });

        it('does not reuse the result of a previous call if the latest block was updated prior to this call', async () => {
          const method = 'eth_getTransactionReceipt';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: { blockHash: '0x100' } },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: { blockHash: '0x200' } },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual([
            { blockHash: '0x100' },
            { blockHash: '0x200' },
          ]);
        });

        it('does not reuse the results of a previous call if it had different arguments', async () => {
          const method = 'eth_getTransactionReceipt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value'] },
            rpcResponse: { result: { blockHash: '0x100' } },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some other value'] },
            rpcResponse: { result: { blockHash: '0x200' } },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some other value'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual([
            { blockHash: '0x100' },
            { blockHash: '0x200' },
          ]);
        });
      });

      it('does not cache a result if its returned blockHash is null', async () => {
        const method = 'eth_getTransactionReceipt';
        const scope = mockInitialRequestsToInfura();
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: { result: { blockHash: null, extra: 'some value' } },
        });
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: {
            result: { blockHash: null, extra: 'some other value' },
          },
        });

        const results = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              getPendingTransactionByHash() {
                return null;
              },
            },
          },
          async ({ ethQuery }) => {
            return [
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
            ];
          },
        );

        expect(results).toStrictEqual([
          { blockHash: null, extra: 'some value' },
          { blockHash: null, extra: 'some other value' },
        ]);
      });

      it('does not cache a result if its returned blockHash is undefined', async () => {
        const method = 'eth_getTransactionReceipt';
        const scope = mockInitialRequestsToInfura();
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: {
            result: { blockHash: undefined, extra: 'some value' },
          },
        });
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: {
            result: { blockHash: undefined, extra: 'some other value' },
          },
        });

        const results = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              getPendingTransactionByHash() {
                return null;
              },
            },
          },
          async ({ ethQuery }) => {
            return [
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
            ];
          },
        );

        expect(results).toStrictEqual([
          { extra: 'some value' },
          { extra: 'some other value' },
        ]);
      });

      it('does not cache a result if its returned blockHash is "0x0000000000000000000000000000000000000000000000000000000000000000"', async () => {
        const method = 'eth_getTransactionReceipt';
        const scope = mockInitialRequestsToInfura();
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: {
            result: {
              blockHash:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
              extra: 'some value',
            },
          },
        });
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: {
            result: {
              blockHash:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
              extra: 'some other value',
            },
          },
        });

        const results = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              getPendingTransactionByHash() {
                return null;
              },
            },
          },
          async ({ ethQuery }) => {
            return [
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
            ];
          },
        );

        expect(results).toStrictEqual([
          {
            blockHash:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            extra: 'some value',
          },
          {
            blockHash:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            extra: 'some other value',
          },
        ]);
      });

      it('does not cache a result if it has no blockHash', async () => {
        const method = 'eth_getTransactionReceipt';
        const scope = mockInitialRequestsToInfura();
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: {
            result: { some: 'value' },
          },
        });
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method },
          rpcResponse: {
            result: { someOther: 'value' },
          },
        });

        const results = await withConnectionToInfuraNetwork(
          {
            providerParams: {
              getPendingTransactionByHash() {
                return null;
              },
            },
          },
          async ({ ethQuery }) => {
            return [
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              }),
            ];
          },
        );

        expect(results).toStrictEqual([
          { some: 'value' },
          { someOther: 'value' },
        ]);
      });
    });

    // Block tag argument at 0th position

    describe(`when the RPC method is "eth_getBlockByNumber"`, () => {
      describe('given no block tag', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('does not reuse the result of a previous call if the latest block number was updated prior to this call', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getBlockByNumber';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });
      });

      describe('given a block tag of "latest"', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['latest'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['latest'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['latest'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['latest'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('does not reuse the result of a previous call if the latest block was updated prior to this call', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['latest'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['latest'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['latest'] },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['latest'] },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getBlockByNumber';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['latest'] },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['latest'] },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['latest'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['latest'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });
      });

      describe('given a block tag of "earliest"', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['earliest'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['earliest'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['earliest'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['earliest'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('reuses the result of a previous call even if the latest block was updated prior to this call', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['earliest'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['earliest'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['earliest'] },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['earliest'] },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getBlockByNumber';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['earliest'] },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['earliest'] },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['earliest'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['earliest'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });

        it('reuses the result of a previous call even if the next call uses a block number of "0x00" instead of "earliest"', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['earliest'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['0x00'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['earliest'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['0x00'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });
      });

      describe('given a block tag of "pending"', () => {
        it('passes the request through to Infura on all calls and does not cache anything', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['pending'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['pending'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['pending'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['pending'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });
      });

      describe('given a block number', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['0x100'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['0x100'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['0x100'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['0x100'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('reuses the result of a previous call even if the latest block was updated prior to this call', async () => {
          const method = 'eth_getBlockByNumber';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber' },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['0x100'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber' },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['0x100'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['0x100'] },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['0x100'] },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getBlockByNumber';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['0x100'] },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['0x100'] },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['0x100'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['0x100'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });
      });

      it('does not reuse the results of a previous call if it had different arguments', async () => {
        const method = 'eth_getBlockByNumber';
        const scope = mockInitialRequestsToInfura();
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method, params: ['0x100'] },
          rpcResponse: { result: 'first result' },
        });
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method, params: ['0x200'] },
          rpcResponse: { result: 'second result' },
        });

        const results = await withConnectionToInfuraNetwork(
          async ({ ethQuery }) => {
            return [
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['0x100'] },
              }),
              await makeRpcCall({
                ethQuery,
                rpcRequest: { method, params: ['0x200'] },
              }),
            ];
          },
        );

        expect(results).toStrictEqual(['first result', 'second result']);
      });
    });

    // Block tag argument at 1st position

    [
      'eth_getBalance',
      'eth_getCode',
      'eth_getTransactionCount',
      'eth_call',
    ].forEach((method) => {
      describe(`when the RPC method is "${method}"`, () => {
        describe('given no block tag', () => {
          it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual(['first result', 'first result']);
          });

          it('does not reuse the result of a previous call if the latest block number was updated prior to this call', async () => {
            const scope = buildScopeForMockingInfuraRequests();
            mockInfuraRequestsForProbes(scope);
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x1' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x2' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                const firstResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value'] },
                });
                // Proceed to the next iteration of the block tracker
                // so that a new block is fetched and the current block is updated
                clock.runAll();
                const secondResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value'] },
                });
                return [firstResult, secondResult];
              },
            );

            expect(results).toStrictEqual(['first result', 'second result']);
          });

          [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
            it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
              const scope = mockInitialRequestsToInfura();
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value'] },
                rpcResponse: { result: emptyValue },
              });
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value'] },
                rpcResponse: { result: 'some result' },
              });

              const results = await withConnectionToInfuraNetwork(
                async ({ ethQuery }) => {
                  return [
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value'] },
                    }),
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value'] },
                    }),
                  ];
                },
              );

              expect(results).toStrictEqual([emptyValue, 'some result']);
            });
          });
        });

        describe('given a block tag of "latest"', () => {
          it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'latest'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'latest'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', 'latest'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', 'latest'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual(['first result', 'first result']);
          });

          it('does not reuse the result of a previous call if the latest block was updated prior to this call', async () => {
            const scope = buildScopeForMockingInfuraRequests();
            mockInfuraRequestsForProbes(scope);
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x1' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'latest'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x2' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'latest'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                const firstResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', 'latest'] },
                });
                // Proceed to the next iteration of the block tracker
                // so that a new block is fetched and the current block is updated
                clock.runAll();
                const secondResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', 'latest'] },
                });
                return [firstResult, secondResult];
              },
            );

            expect(results).toStrictEqual(['first result', 'second result']);
          });

          [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
            it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
              const scope = mockInitialRequestsToInfura();
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', 'latest'] },
                rpcResponse: { result: emptyValue },
              });
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', 'latest'] },
                rpcResponse: { result: 'some result' },
              });

              const results = await withConnectionToInfuraNetwork(
                async ({ ethQuery }) => {
                  return [
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value', 'latest'] },
                    }),
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value', 'latest'] },
                    }),
                  ];
                },
              );

              expect(results).toStrictEqual([emptyValue, 'some result']);
            });
          });
        });

        describe('given a block tag of "earliest"', () => {
          it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'earliest'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'earliest'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', 'earliest'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', 'earliest'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual(['first result', 'first result']);
          });

          it('reuses the result of a previous call even if the latest block was updated prior to this call', async () => {
            const scope = buildScopeForMockingInfuraRequests();
            mockInfuraRequestsForProbes(scope);
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x1' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'earliest'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber', params: [] },
              rpcResponse: { result: '0x2' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'earliest'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                const firstResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', 'earliest'] },
                });
                // Proceed to the next iteration of the block tracker
                // so that a new block is fetched and the current block is updated
                clock.runAll();
                const secondResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', 'earliest'] },
                });
                return [firstResult, secondResult];
              },
            );

            expect(results).toStrictEqual(['first result', 'first result']);
          });

          [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
            it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
              const scope = mockInitialRequestsToInfura();
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', 'earliest'] },
                rpcResponse: { result: emptyValue },
              });
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', 'earliest'] },
                rpcResponse: { result: 'some result' },
              });

              const results = await withConnectionToInfuraNetwork(
                async ({ ethQuery }) => {
                  return [
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: {
                        method,
                        params: ['some value', 'earliest'],
                      },
                    }),
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: {
                        method,
                        params: ['some value', 'earliest'],
                      },
                    }),
                  ];
                },
              );

              expect(results).toStrictEqual([emptyValue, 'some result']);
            });
          });

          it('reuses the result of a previous call even if the next call uses a block number of "0x00" instead of "earliest"', async () => {
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', 'earliest'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', '0x00'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', 'earliest'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', '0x00'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual(['first result', 'first result']);
          });
        });

        // "pending" has a special case around it (and this is tested above anyway)
        if (method !== 'eth_getTransactionCount') {
          describe('given a block tag of "pending"', () => {
            it('passes the request through to Infura on all calls and does not cache anything', async () => {
              const scope = mockInitialRequestsToInfura();
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', 'pending'] },
                rpcResponse: { result: 'first result' },
              });
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', 'pending'] },
                rpcResponse: { result: 'second result' },
              });

              const results = await withConnectionToInfuraNetwork(
                async ({ ethQuery }) => {
                  return [
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value', 'pending'] },
                    }),
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value', 'pending'] },
                    }),
                  ];
                },
              );

              expect(results).toStrictEqual(['first result', 'second result']);
            });
          });
        }

        describe('given a block number', () => {
          it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', '0x100'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', '0x100'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', '0x100'] },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: { method, params: ['some value', '0x100'] },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual(['first result', 'first result']);
          });

          it('reuses the result of a previous call even if the latest block was updated prior to this call', async () => {
            const scope = buildScopeForMockingInfuraRequests();
            mockInfuraRequestsForProbes(scope);
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber' },
              rpcResponse: { result: '0x1' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', '0x100'] },
              rpcResponse: { result: 'first result' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method: 'eth_blockNumber' },
              rpcResponse: { result: '0x2' },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: { method, params: ['some value', '0x100'] },
              rpcResponse: { result: 'second result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                const firstResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', '0x100'] },
                });
                // Proceed to the next iteration of the block tracker
                // so that a new block is fetched and the current block is updated
                clock.runAll();
                const secondResult = await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', '0x100'] },
                });
                return [firstResult, secondResult];
              },
            );

            expect(results).toStrictEqual(['first result', 'first result']);
          });

          [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
            it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
              const scope = mockInitialRequestsToInfura();
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', '0x100'] },
                rpcResponse: { result: emptyValue },
              });
              mockSuccessfulRpcCallToInfura({
                scope,
                rpcRequest: { method, params: ['some value', '0x100'] },
                rpcResponse: { result: 'some result' },
              });

              const results = await withConnectionToInfuraNetwork(
                async ({ ethQuery }) => {
                  return [
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value', '0x100'] },
                    }),
                    await makeRpcCall({
                      ethQuery,
                      rpcRequest: { method, params: ['some value', '0x100'] },
                    }),
                  ];
                },
              );

              expect(results).toStrictEqual([emptyValue, 'some result']);
            });
          });
        });

        it('does not reuse the results of a previous call if it had different arguments', async () => {
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value', '0x100'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value', '0x200'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', '0x100'] },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: { method, params: ['some value', '0x200'] },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });
      });
    });

    // Block tag argument at 2nd position

    describe(`when the RPC method is "eth_getStorageAt"`, () => {
      describe('given no block tag', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getStorageAt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value', 'some other value'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value', 'some other value'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value'],
                  },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value'],
                  },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('does not reuse the result of a previous call if the latest block number was updated prior to this call', async () => {
          const method = 'eth_getStorageAt';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value', 'some other value'] },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method, params: ['some value', 'some other value'] },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value'],
                },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value'],
                },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getStorageAt';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value'],
              },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value'],
              },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value'],
                    },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value'],
                    },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });
      });

      describe('given a block tag of "latest"', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getStorageAt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'latest'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'latest'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', 'latest'],
                  },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', 'latest'],
                  },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('does not reuse the result of a previous call if the latest block was updated prior to this call', async () => {
          const method = 'eth_getStorageAt';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'latest'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'latest'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', 'latest'],
                },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', 'latest'],
                },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getStorageAt';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value', 'latest'],
              },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value', 'latest'],
              },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value', 'latest'],
                    },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value', 'latest'],
                    },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });
      });

      describe('given a block tag of "earliest"', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getStorageAt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'earliest'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'earliest'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', 'earliest'],
                  },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', 'earliest'],
                  },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('reuses the result of a previous call even if the latest block was updated prior to this call', async () => {
          const method = 'eth_getStorageAt';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'earliest'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber', params: [] },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'earliest'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', 'earliest'],
                },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', 'earliest'],
                },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getStorageAt';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value', 'earliest'],
              },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value', 'earliest'],
              },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value', 'earliest'],
                    },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value', 'earliest'],
                    },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });

        it('reuses the result of a previous call even if the next call uses a block number of "0x00" instead of "earliest"', async () => {
          const method = 'eth_getStorageAt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'earliest'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', '0x00'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', 'earliest'],
                  },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', '0x00'],
                  },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });
      });

      describe('given a block tag of "pending"', () => {
        it('passes the request through to Infura on all calls and does not cache anything', async () => {
          const method = 'eth_getStorageAt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'pending'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', 'pending'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', 'pending'],
                  },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', 'pending'],
                  },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });
      });

      describe('given a block number', () => {
        it('passes the result through to Infura, reusing the result from a previous identical call if possible', async () => {
          const method = 'eth_getStorageAt';
          const scope = mockInitialRequestsToInfura();
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', '0x100'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', '0x100'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              return [
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', '0x100'],
                  },
                }),
                await makeRpcCall({
                  ethQuery,
                  rpcRequest: {
                    method,
                    params: ['some value', 'some other value', '0x100'],
                  },
                }),
              ];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        it('reuses the result of a previous call even if the latest block was updated prior to this call', async () => {
          const method = 'eth_getStorageAt';
          const scope = buildScopeForMockingInfuraRequests();
          mockInfuraRequestsForProbes(scope);
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber' },
            rpcResponse: { result: '0x1' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', '0x100'],
            },
            rpcResponse: { result: 'first result' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: { method: 'eth_blockNumber' },
            rpcResponse: { result: '0x2' },
          });
          mockSuccessfulRpcCallToInfura({
            scope,
            rpcRequest: {
              method,
              params: ['some value', 'some other value', '0x100'],
            },
            rpcResponse: { result: 'second result' },
          });

          const results = await withConnectionToInfuraNetwork(
            async ({ ethQuery }) => {
              const firstResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', '0x100'],
                },
              });
              // Proceed to the next iteration of the block tracker
              // so that a new block is fetched and the current block is updated
              clock.runAll();
              const secondResult = await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', '0x100'],
                },
              });
              return [firstResult, secondResult];
            },
          );

          expect(results).toStrictEqual(['first result', 'first result']);
        });

        [null, undefined, '\u003cnil\u003e'].forEach((emptyValue) => {
          it(`does not reuse the result of a previous call if it was ${emptyValue}`, async () => {
            const method = 'eth_getStorageAt';
            const scope = mockInitialRequestsToInfura();
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value', '0x100'],
              },
              rpcResponse: { result: emptyValue },
            });
            mockSuccessfulRpcCallToInfura({
              scope,
              rpcRequest: {
                method,
                params: ['some value', 'some other value', '0x100'],
              },
              rpcResponse: { result: 'some result' },
            });

            const results = await withConnectionToInfuraNetwork(
              async ({ ethQuery }) => {
                return [
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value', '0x100'],
                    },
                  }),
                  await makeRpcCall({
                    ethQuery,
                    rpcRequest: {
                      method,
                      params: ['some value', 'some other value', '0x100'],
                    },
                  }),
                ];
              },
            );

            expect(results).toStrictEqual([emptyValue, 'some result']);
          });
        });
      });

      it('does not reuse the results of a previous call if it had different arguments', async () => {
        const method = 'eth_getStorageAt';
        const scope = mockInitialRequestsToInfura();
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: {
            method,
            params: ['some value', 'some other value', '0x100'],
          },
          rpcResponse: { result: 'first result' },
        });
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: {
            method,
            params: ['some value', 'some other value', '0x200'],
          },
          rpcResponse: { result: 'second result' },
        });

        const results = await withConnectionToInfuraNetwork(
          async ({ ethQuery }) => {
            return [
              await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', '0x100'],
                },
              }),
              await makeRpcCall({
                ethQuery,
                rpcRequest: {
                  method,
                  params: ['some value', 'some other value', '0x200'],
                },
              }),
            ];
          },
        );

        expect(results).toStrictEqual(['first result', 'second result']);
      });
    });

    // [TODO]

    // Inflight cache middleware

    // [TODO]

    // Block ref middleware

    // [TODO]

    // Create retry on empty middleware

    // [TODO]

    // Block tracker inspector middleware

    // [TODO]

    // -----------
    // Infura middleware
    // (eth-json-rpc-infura -> createInfuraMiddleware)
    // -----------

    describe('when the RPC method is anything', () => {
      it('passes the request through to Infura, throwing a specific error message if it responds with 405', async () => {
        const scope = mockInitialRequestsToInfura();
        mockArbitraryRpcCallToInfura({ scope }).reply(405);

        const promiseForResult = withConnectionToInfuraNetwork(({ ethQuery }) =>
          callArbitraryRpcMethod({ ethQuery }),
        );

        await expect(promiseForResult).rejects.toThrow(
          'The method does not exist / is not available.',
        );
      });

      it('passes the request through to Infura, throwing a specific error message if it responds with 429', async () => {
        const scope = mockInitialRequestsToInfura();
        mockArbitraryRpcCallToInfura({ scope }).reply(429);

        const promiseForResult = withConnectionToInfuraNetwork(({ ethQuery }) =>
          callArbitraryRpcMethod({ ethQuery }),
        );

        await expect(promiseForResult).rejects.toThrow(
          'Request is being rate limited',
        );
      });

      describe('if the request to Infura responds with 503', () => {
        it('retries the request up to 5 times until Infura responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope }).times(4).reply(503);
          mockArbitraryRpcCallToInfura({ scope }).reply(200, {
            jsonrpc: '2.0',
            id: 1,
            result: 'result from Infura',
          });

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);
          const result = await promiseForResult;

          expect(result).toStrictEqual('result from Infura');
        });

        it('throws an error if Infura never responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope }).times(5).reply(503);

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);

          await expect(promiseForResult).rejects.toThrow(
            /^InfuraProvider - cannot complete request\. All retries exhausted\./u,
          );
        });
      });

      describe('if the request to Infura responds with 504', () => {
        it('retries the request up to 5 times until Infura responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope }).times(4).reply(504);
          mockArbitraryRpcCallToInfura({ scope }).reply(200, {
            jsonrpc: '2.0',
            id: 1,
            result: 'result from Infura',
          });

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);
          const result = await promiseForResult;

          expect(result).toStrictEqual('result from Infura');
        });

        it('throws an error if Infura never responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope }).times(5).reply(504);

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);

          await expect(promiseForResult).rejects.toThrow(
            /^InfuraProvider - cannot complete request\. All retries exhausted\./u,
          );
        });
      });

      describe('if the request to Infura times out', () => {
        it('retries the request up to 5 times until Infura responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope })
            .times(4)
            .replyWithError('ETIMEDOUT: Some error message');
          mockArbitraryRpcCallToInfura({ scope }).reply(200, {
            jsonrpc: '2.0',
            id: 1,
            result: 'result from Infura',
          });

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);
          const result = await promiseForResult;

          expect(result).toStrictEqual('result from Infura');
        });

        it('throws an error if Infura never responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope })
            .times(5)
            .replyWithError('ETIMEDOUT: Some error message');

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);

          await expect(promiseForResult).rejects.toThrow(
            /^InfuraProvider - cannot complete request\. All retries exhausted\./u,
          );
        });
      });

      describe('if a "connection reset" error is thrown while making the request to Infura', () => {
        it('retries the request up to 5 times until Infura responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope })
            .times(4)
            .replyWithError('ECONNRESET: Some error message');
          mockArbitraryRpcCallToInfura({ scope }).reply(200, {
            jsonrpc: '2.0',
            id: 1,
            result: 'result from Infura',
          });

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);
          const result = await promiseForResult;

          expect(result).toStrictEqual('result from Infura');
        });

        it('throws an error if the request never responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope })
            .times(5)
            .replyWithError('ECONNRESET: Some error message');

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);

          await expect(promiseForResult).rejects.toThrow(
            /^InfuraProvider - cannot complete request\. All retries exhausted\./u,
          );
        });
      });

      describe('if the request to Infura responds with HTML or something else that is non-JSON-parseable', () => {
        it('retries the request up to 5 times until Infura returns something JSON-parseable', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope })
            .times(4)
            .reply('<html><p>Some error message</p></html>');
          mockArbitraryRpcCallToInfura({ scope }).reply(200, {
            jsonrpc: '2.0',
            id: 1,
            result: 'result from Infura',
          });

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);
          const result = await promiseForResult;

          expect(result).toStrictEqual('result from Infura');
        });

        it('throws an error if Infura never responds with 2xx', async () => {
          const scope = mockInitialRequestsToInfura();
          mockArbitraryRpcCallToInfura({ scope })
            .times(5)
            .reply('<html><p>Some error message</p></html>');

          const promiseForResult = withConnectionToInfuraNetwork(
            ({ ethQuery }) => callArbitraryRpcMethod({ ethQuery }),
          );
          await skipThroughSleepsBeforeRequestRetries(clock);

          await expect(promiseForResult).rejects.toThrow(
            /^InfuraProvider - cannot complete request\. All retries exhausted\./u,
          );
        });
      });
    });

    describe('when the RPC method is "eth_getBlockByNumber"', () => {
      it('overrides the result with null when the response from Infura is 2xx but the response text is "Not Found"', async () => {
        const scope = mockInitialRequestsToInfura();
        mockSuccessfulRpcCallToInfura({
          scope,
          rpcRequest: { method: 'eth_getBlockByNumber', params: ['latest'] },
          rawResponse: 'Not Found',
        });

        const result = await withConnectionToInfuraNetwork(({ ethQuery }) =>
          makeRpcCall({
            ethQuery,
            rpcRequest: {
              method: 'eth_getBlockByNumber',
              params: ['latest'],
            },
          }),
        );

        expect(result).toBeNull();
      });
    });
  });
});
