import { createHash } from 'crypto';
import { it as jestIt } from '@jest/globals';
import type { CompletedRequest, Mockttp } from 'mockttp';
import { mockInitialFullScan } from '../tests/btc/mocks/esplora';

type EndpointCallback = Parameters<
  ReturnType<Mockttp['forGet']>['thenCallback']
>[0];

/**
 * Captures Mockttp handlers without opening sockets or starting an E2E server.
 *
 * @returns A mock server and a dispatcher for the registered public endpoints.
 */
function captureEndpoints() {
  const endpoints: {
    method: string;
    pattern: RegExp;
    callback: EndpointCallback;
  }[] = [];
  const register = (method: string) => (pattern: RegExp) => {
    const builder = {
      always: () => builder,
      thenCallback: (callback: EndpointCallback) => {
        endpoints.push({ method, pattern, callback });
        return Promise.resolve();
      },
    };
    return builder;
  };
  const server = {
    forGet: jest.fn(register('GET')),
    forPost: jest.fn(register('POST')),
  } as unknown as Mockttp;

  return {
    server,
    request: async (method: string, path: string, body = '') => {
      const url = `https://bitcoin-mainnet.infura.io/v3/${'a'.repeat(32)}/esplora${path}`;
      const endpoint = endpoints.find(
        (candidate) =>
          candidate.method === method && candidate.pattern.test(url),
      );
      if (!endpoint) {
        throw new Error(`No mock registered for ${method} ${path}`);
      }
      return await endpoint.callback({
        url,
        body: { getText: async () => body },
      } as unknown as CompletedRequest);
    },
  };
}

describe('mockInitialFullScan', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Explicit serialized fields make the independent txid preimage inspectable:
  // version, one input (prevout, scriptSig, sequence), one output, locktime.
  const version = '01000000';
  const inputsAndOutputs = `01${'00'.repeat(32)}000000000151ffffffff0101000000000000000151`;
  const locktime = '00000000';
  const strippedHex = version + inputsAndOutputs + locktime;
  const witnessHex = `${version}0001${inputsAndOutputs}0201aa02bbbb${locktime}`;

  jestIt.each([
    ['legacy', strippedHex],
    ['SegWit', witnessHex],
  ])('returns the real txid for a %s broadcast', async (_format, rawHex) => {
    const { server, request } = captureEndpoints();
    await mockInitialFullScan(server);
    // Hash an explicitly witness-free preimage, not production parsing output.
    const expectedTxid = createHash('sha256')
      .update(
        createHash('sha256').update(Buffer.from(strippedHex, 'hex')).digest(),
      )
      .digest()
      .reverse()
      .toString('hex');

    const response = await request('POST', '/tx', rawHex);

    expect(response).toStrictEqual({ statusCode: 200, body: expectedTxid });
    if (rawHex === witnessHex) {
      const wtxid = createHash('sha256')
        .update(
          createHash('sha256').update(Buffer.from(rawHex, 'hex')).digest(),
        )
        .digest()
        .reverse()
        .toString('hex');
      expect(expectedTxid).not.toBe(wtxid);
    }
  });

  it('keeps static funding and chain responses unchanged after broadcasts', async () => {
    const { server, request } = captureEndpoints();
    await mockInitialFullScan(server);
    const fundingTxid =
      '7a9d27d80e05abc2cf15c6bc87a70a6badf5f5aa6615aa8e346d92fccf7dfc10';
    const fundingBlockHash =
      '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748';
    const tipHash =
      '00000000000000000001d3a19bc9dbde9d1d26b25aa49269b575282bb6d74409';
    const scripthash =
      '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';
    const paths = [
      '/blocks',
      '/blocks/tip/height',
      '/blocks/tip/hash',
      `/scripthash/${scripthash}/txs`,
      `/scripthash/${scripthash}/utxo`,
      `/tx/${fundingTxid}`,
      `/tx/${fundingTxid}/outspends`,
      `/block/${fundingBlockHash}`,
      '/block-height/932935',
      '/block-height/932937',
      '/fee-estimates',
      `/tx/${'f'.repeat(64)}`,
    ];
    const before = await Promise.all(paths.map((path) => request('GET', path)));
    // Save values, not references that a stateful mock might mutate later.
    const original = JSON.parse(JSON.stringify(before));
    expect(before[0]).toMatchObject({
      statusCode: 200,
      json: [{ id: tipHash, height: 932936 }, {}, {}],
    });
    expect(before[1]).toStrictEqual({ statusCode: 200, body: '932936' });
    expect(before[2]).toStrictEqual({ statusCode: 200, body: tipHash });
    expect(before[3]).toMatchObject({
      statusCode: 200,
      json: [{ txid: fundingTxid, status: { confirmed: true } }],
    });
    expect(before[4]).toMatchObject({
      statusCode: 200,
      json: [{ txid: fundingTxid, vout: 0, value: 100000000 }],
    });
    expect(before[6]).toStrictEqual({
      statusCode: 200,
      json: [{ spent: false }],
    });
    expect(before[9]).toStrictEqual({
      statusCode: 200,
      body: '0'.repeat(64),
    });
    expect(before[11]).toStrictEqual({
      statusCode: 404,
      body: 'Transaction not found',
    });

    await request('POST', '/tx', strippedHex);
    await request('POST', '/tx', witnessHex);
    const after = await Promise.all(paths.map((path) => request('GET', path)));

    expect(after).toStrictEqual(original);
    const broadcastResponse = await request('POST', '/tx', witnessHex);
    const broadcastTxid = (broadcastResponse as { body: string }).body;
    expect(await request('GET', `/tx/${broadcastTxid}`)).toStrictEqual({
      statusCode: 404,
      body: 'Transaction not found',
    });
  });
});
