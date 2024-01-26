import { Server, server } from 'ganache';

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

export class Ganache {
  #server: Server | undefined;

  async start(opts: any) {
    const options = { ...defaultOptions, ...opts };

    this.#server = server(options);
    await this.#server.listen(options.port);
  }

  getProvider() {
    return this.#server?.provider;
  }

  async getAccounts() {
    return await this.getProvider()?.request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance() {
    const accounts = await this.getAccounts();
    const provider = await this.getProvider();

    if (!accounts || !accounts[0] || !provider) {
      console.log('No accounts found');
      return 0;
    }

    const balanceHex = await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return balanceFormatted;
  }

  async quit() {
    if (!this.#server) {
      throw new Error('Server not running yet');
    }
    try {
      await this.#server.close();
    } catch (e: any) {
      // We can safely ignore the EBUSY error
      if (e.code !== 'EBUSY') {
        console.log('Caught error while Ganache closing:', e);
      }
    }
  }
}
