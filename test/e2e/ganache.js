const ganache = require('ganache');

const defaultOptions = {
  blockTime: 2,
  network_id: 1337,
  mnemonic:
    'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
  port: 8545,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  quiet: true,
};

class Ganache {
  async start(opts) {
    const options = { ...defaultOptions, ...opts };
    const { port } = options;
    this._server = ganache.server(options);
    await this._server.listen(port);
  }

  getProvider() {
    return this._server.provider;
  }

  async getAccounts() {
    return await this.getProvider().request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance() {
    const accounts = await this.getAccounts();
    const balanceHex = await this.getProvider().request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return balanceFormatted;
  }

  async quit() {
    if (!this._server) {
      throw new Error('Server not running yet');
    }
    await this._server.close();
  }
}

module.exports = Ganache;
