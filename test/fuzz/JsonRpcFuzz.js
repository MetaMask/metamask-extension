import { createTestProviderTools, providerResultStub } from '../stub/provider';

export default class JsonRPCFuzz {
  constructor(opts = {}) {
    this.engine = createTestProviderTools({
      scaffold: providerResultStub,
      networkId: opts.networkId,
      chainId: opts.chainId,
      logging: { quiet: true },
    }).engine;
    this.selectedAddress = this.ethAccounts()[0];
  }

  ethAccounts(data) {
    const ethAccounts = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_accounts',
    };

    if (data) {
      ethAccounts.params = [data.toString()];
    }

    return this.engine.handle(ethAccounts);
  }

  ethBlockNumber(data) {
    const dataString = data.toString();

    const ethBlockNumber = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [dataString],
    };

    return this.engine.handle(ethBlockNumber);
  }
}
