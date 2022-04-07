import {
  mockingInfuraCommunications,
  withInfuraClient,
  buildMockParamsWithoutBlockParamAt,
  buildMockParamsWithBlockParamAt,
  buildRequestWithReplacedBlockParam,
} from './helpers';

/**
 * Defines tests which exercise the behavior exhibited by an RPC method that
 * does not support params (which affects how the method is cached).
 */
/* eslint-disable-next-line jest/no-export */
export function testsForRpcMethodThatDoesNotSupportParams(method) {
  describe('behaves like an RPC method that does not support params', () => {
    it('does not hit Infura more than once for identical requests', async () => {
      const requests = [{ method }, { method }];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it('hits Infura and does not reuse the result of a previous request if the latest block number was updated since', async () => {
      const requests = [{ method }, { method }];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // Note that we have to mock these requests in a specific order. The
        // first block tracker request occurs because of the first RPC request.
        // The second block tracker request, however, does not occur because of
        // the second RPC request, but rather because we call `clock.runAll()`
        // below.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a new
          // block is fetched and the current block is updated
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        });

        expect(results).toStrictEqual(mockResults);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [{ method }, { method }];
        const mockResults = [emptyValue, 'some result'];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      },
    );
  });
}

/**
 * Defines tests which exercise the behavior exhibited by an RPC method that
 * use `blockHash` in the response data to determine whether the response is
 * cacheable.
 */
/* eslint-disable-next-line jest/no-export */
export function testsForRpcMethodsThatCheckForBlockHashInResponse(method) {
  describe('behaves like an RPC method that checks for `blockHash` in the response', () => {
    it('does not hit Infura more than once for identical requests and it has a valid blockHash', async () => {
      const requests = [{ method }, { method }];
      const mockResults = [{ blockHash: '0x100' }, { blockHash: '0x200' }];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });

        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it('hits Infura and does not reuse the result of a previous request if the latest block number was updated since', async () => {
      const requests = [{ method }, { method }];
      const mockResults = [{ blockHash: '0x100' }, { blockHash: '0x200' }];

      await mockingInfuraCommunications(async (comms) => {
        // Note that we have to mock these requests in a specific order. The
        // first block tracker request occurs because of the first RPC
        // request. The second block tracker request, however, does not occur
        // because of the second RPC request, but rather because we call
        // `clock.runAll()` below.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a new
          // block is fetched and the current block is updated
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        });

        expect(results).toStrictEqual(mockResults);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [{ method }, { method }];
        const mockResults = [emptyValue, { blockHash: '0x100' }];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      },
    );

    it('does not reuse the result of a previous request if result.blockHash was null', async () => {
      const requests = [{ method }, { method }];
      const mockResults = [
        { blockHash: null, extra: 'some value' },
        { blockHash: '0x100', extra: 'some other value' },
      ];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    });

    it('does not reuse the result of a previous request if result.blockHash was undefined', async () => {
      const requests = [{ method }, { method }];
      const mockResults = [
        { extra: 'some value' },
        { blockHash: '0x100', extra: 'some other value' },
      ];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    });

    it('does not reuse the result of a previous request if result.blockHash was "0x0000000000000000000000000000000000000000000000000000000000000000"', async () => {
      const requests = [{ method }, { method }];
      const mockResults = [
        {
          blockHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          extra: 'some value',
        },
        { blockHash: '0x100', extra: 'some other value' },
      ];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    });
  });
}

/**
 * Defines tests which exercise the behavior exhibited by an RPC method that
 * supports multiple params (which affect how the method is cached).
 */
/* eslint-disable-next-line jest/no-export */
export function testsForRpcMethodThatSupportsMultipleParams(
  method,
  { numberOfParams },
) {
  const blockParamIndex = numberOfParams;

  describe.each([
    ['given no block tag', 'none'],
    ['given a block tag of "latest"', 'latest', 'latest'],
  ])('%s', (_desc, blockParamType, blockParam) => {
    const params =
      blockParamType === 'none'
        ? buildMockParamsWithoutBlockParamAt(blockParamIndex)
        : buildMockParamsWithBlockParamAt(blockParamIndex, blockParam);

    it('does not hit Infura more than once for identical requests', async () => {
      const requests = [
        { method, params },
        { method, params },
      ];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the block-cache
        // middleware will request the latest block number through the block
        // tracker to determine the cache key. Later, the block-ref
        // middleware will request the latest block number again to resolve
        // the value of "latest", but the block number is cached once made,
        // so we only need to mock the request once.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number.
        comms.mockSuccessfulInfuraRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[0],
            blockParamIndex,
            '0x100',
          ),
          response: { result: mockResults[0] },
        });
        // Note that the block-ref middleware will still allow the original
        // request to go through.
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });

        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it('hits Infura and does not reuse the result of a previous request if the latest block number was updated since', async () => {
      const requests = [
        { method, params },
        { method, params },
      ];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // Note that we have to mock these requests in a specific order.
        // The first block tracker request occurs because of the first RPC
        // request. The second block tracker request, however, does not
        // occur because of the second RPC request, but rather because we
        // call `clock.runAll()` below.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number.
        comms.mockSuccessfulInfuraRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[0],
            blockParamIndex,
            '0x100',
          ),
          response: { result: mockResults[0] },
        });
        // Note that the block-ref middleware will still allow the original
        // request to go through.
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x200' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });
        // The previous two requests will happen again, with a different block
        // number, in the same order.
        comms.mockSuccessfulInfuraRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[0],
            blockParamIndex,
            '0x200',
          ),
          response: { result: mockResults[1] },
        });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a
          // new block is fetched and the current block is updated
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        });

        expect(results).toStrictEqual(mockResults);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [
          { method, params },
          { method, params },
        ];
        const mockResults = [emptyValue, 'some result'];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockSuccessfulInfuraRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[0],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[0] },
          });
          // Note that the block-ref middleware will still allow the original
          // request to go through.
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          // The previous two requests will happen again, in the same order.
          comms.mockSuccessfulInfuraRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[0],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[1] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      },
    );
  });

  describe.each([
    ['given a block tag of "earliest"', 'earliest', 'earliest'],
    ['given a block number', 'block number', '0x100'],
  ])('%s', (_desc, blockParamType, blockParam) => {
    const params = buildMockParamsWithBlockParamAt(blockParamIndex, blockParam);

    it('does not hit Infura more than once for identical requests', async () => {
      const requests = [
        { method, params },
        { method, params },
      ];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the block-cache
        // middleware will request the latest block number through the block
        // tracker to determine the cache key. This block number doesn't
        // matter.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });

        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it('reuses the result of a previous request even if the latest block number was updated since', async () => {
      const requests = [
        { method, params },
        { method, params },
      ];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // Note that we have to mock these requests in a specific order. The
        // first block tracker request occurs because of the first RPC
        // request. The second block tracker request, however, does not
        // occur because of the second RPC request, but rather because we
        // call `clock.runAll()` below.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a
          // new block is fetched and the current block is updated
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        });

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [
          { method, params },
          { method, params },
        ];
        const mockResults = [emptyValue, 'some result'];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      },
    );

    if (blockParamType === 'earliest') {
      it('treats "0x00" as a synonym for "earliest"', async () => {
        const requests = [
          {
            method,
            params: buildMockParamsWithBlockParamAt(
              blockParamIndex,
              blockParam,
            ),
          },
          {
            method,
            params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x00'),
          },
        ];
        const mockResults = ['first result', 'second result'];

        await mockingInfuraCommunications(async (comms) => {
          // The first time a block-cacheable request is made, the latest
          // block number is retrieved through the block tracker first. It
          // doesn't matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
        });
      });
    }

    if (blockParamType === 'block number') {
      it('does not reuse the result of a previous request if it was made with different arguments than this one', async () => {
        await mockingInfuraCommunications(async (comms) => {
          const requests = [
            {
              method,
              params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x100'),
            },
            {
              method,
              params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x200'),
            },
          ];

          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[0],
            response: { result: 'first result' },
          });
          comms.mockSuccessfulInfuraRpcCall({
            request: requests[1],
            response: { result: 'second result' },
          });

          const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
            makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });
      });
    }
  });

  describe('given a block tag of "pending"', () => {
    const params = buildMockParamsWithBlockParamAt(blockParamIndex, 'pending');

    it('hits Infura on all calls and does not cache anything', async () => {
      const requests = [
        { method, params },
        { method, params },
      ];
      const mockResults = ['first result', 'second result'];

      await mockingInfuraCommunications(async (comms) => {
        // The first time a block-cacheable request is made, the latest
        // block number is retrieved through the block tracker first. It
        // doesn't matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockSuccessfulInfuraRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withInfuraClient(({ makeRpcCallsInSeries }) =>
          makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    });
  });
}
