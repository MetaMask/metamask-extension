import { Server, server } from 'ganache';

const defaultOptions = {
  blockTime: 2,
  network_id: 1337,
  mnemonic:
    'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
  port: 8545,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  verbose: true,
};

export class Ganache {
  #server: Server | undefined;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async getAddressBalance(address: string) {
    const provider = await this.getProvider();
    if (!provider) {
      throw new Error('No provider found');
    }
    const balanceHex = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return Number(balanceFormatted);
  }

  async getBalance(accountIndex: number = 0): Promise<number> {
    const accounts = await this.getAccounts();

    if (!accounts?.[accountIndex]) {
      throw new Error('Account not found');
    }

    return this.getAddressBalance(accounts?.[accountIndex]);
  }

  async getFiatBalance(): Promise<number> {
    const balance = await this.getBalance();
    const currencyConversionRate = 1700.0;
    const fiatBalance = (balance * currencyConversionRate).toFixed(2);

    return Number(fiatBalance);
  }

  async setAccountBalance(address: string, balance: string) {
    return await this.getProvider()?.request({
      method: 'evm_setAccountBalance',
      params: [address, balance],
    });
  }

  async quit() {
    if (!this.#server) {
      throw new Error('Server not running yet');
    }
    try {
      await this.#server.close();
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // We can safely ignore the EBUSY error
      if (e.code !== 'EBUSY') {
        console.log('Caught error while Ganache closing:', e);
      }
    }
  }
}
