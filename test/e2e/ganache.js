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

  async quit() {
    if (!this._server) {
      throw new Error('Server not running yet');
    }
    console.log('status:', this._server.status)
    console.time('close')
    await this._server.close();
    console.timeEnd('close')
    console.log('status:', this._server.status)
  }
}

module.exports = Ganache;
