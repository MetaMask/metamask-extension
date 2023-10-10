/* eslint-disable jest/no-standalone-expect */
import JsonRPCFuzz from './JsonRpcFuzz';

describe('Fuzz', () => {
  it.fuzz('eth_blockNumber', async (data) => {
    const a = new JsonRPCFuzz({
      networkId: 1,
      chainId: 1,
    });

    const res = await a.ethGetBalance(data);

    expect(res.error.message).toContain(
      `\`Address\`; strings must be hex-encoded and prefixed with "0x"`,
    );
  });
});
