import scaffoldMiddleware from 'eth-json-rpc-middleware/scaffold';
import { JsonRpcEngine } from 'json-rpc-engine';

const EthQuery = require('eth-query');
const { addressIsContract } = require('./contract-utils');

describe('Contract Utils', () => {
  it('checks is an address is a contract address or not', async () => {
    const scaffold = {
      eth_gasPrice: '0x0de0b6b3a7640000',
      eth_getCode: '0xa',
    };
    const engine = new JsonRpcEngine();
    engine.push(scaffoldMiddleware(scaffold));
    const provider = { sendAsync: engine.handle.bind(engine) };
    const ethQuery = new EthQuery(provider);
    const { isContractAddress } = await addressIsContract(
      ethQuery,
      '0x76B4aa9Fc4d351a0062c6af8d186DF959D564A84',
    );
    expect(isContractAddress).toStrictEqual(false);
  });
});
