/* eslint-disable jest/no-standalone-expect */
import JsonRPCFuzz from './JsonRpcFuzz';

describe('Fuzz', () => {
  it.fuzz('eth_blockNumber', async (data) => {
    const a = new JsonRPCFuzz({
      networkId: 1,
      chainId: 1,
    });

    const res = await a.ethBlockNumber(data);

    expect(res.error.message).toStrictEqual(
      `Incorrect number of arguments. 'eth_blockNumber' requires exactly 0 arguments.`,
    );
  });
});
