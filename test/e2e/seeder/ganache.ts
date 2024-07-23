import { Server, server, ServerOptions } from 'ganache';
import { BigNumber } from 'bignumber.js';
import { DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC } from '../constants';

const PRIVATE_KEY =
  '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC';

const convertToHexValue = (val: number) =>
  `0x${new BigNumber(val, 10).toString(16)}`;

const convertETHToHexGwei = (eth: number) => convertToHexValue(eth * 10 ** 18);

const defaultOptions = {
  blockTime: 2,
  network_id: 1337,
  port: 8545,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  verbose: true,
};

type GanacheStartOptions = Partial<ServerOptions> & {
  mnemonic?: string;
  accounts?: { secretKey: string; balance: string }[];
};

export class Ganache {
  #server: Server | undefined;

  async start(opts: GanacheStartOptions) {
    let customOptions = {
      ...defaultOptions,
      ...opts,
    };
    // Check if mnemonic and custom accounts are provided in options
    // and add a default account value if not
    if (!customOptions.mnemonic && !customOptions.accounts) {
      customOptions = {
        ...customOptions,
        accounts: [
          {
            secretKey: PRIVATE_KEY,
            balance: convertETHToHexGwei(
              Number(DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC),
            ),
          },
        ],
      };
    }

    this.#server = server(customOptions);
    await this.#server.listen(customOptions.port);
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

  async mineBlock() {
    return await this.getProvider()?.request({
      method: 'evm_mine',
      params: [],
    });
  }

  async quit() {
    if (!this.#server) {
      throw new Error('Server not running yet');
    }
    try {
      await this.#server.close();
    } catch (e: unknown) {
      // We can safely ignore the EBUSY error
      if ((e as { code?: string }).code !== 'EBUSY') {
        console.log('Caught error while Ganache closing:', e);
      }
    }
  }
}
