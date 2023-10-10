/* eslint-disable jest/no-standalone-expect */
import JsonRPCFuzz from './JsonRpcFuzz';

describe('Fuzz', () => {
  it.fuzz('eth_accounts ', async (data) => {
    const a = new JsonRPCFuzz({
      networkId: 1,
      chainId: 1,
    });

    const res = await a.ethAccounts(data);

    expect(res.error.message).toStrictEqual(
      `Incorrect number of arguments. 'eth_accounts' requires exactly 0 arguments.`,
    );
  });
});
