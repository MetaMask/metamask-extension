import type { AnvilParameters } from 'prool/instances' with { 'resolution-mode': 'import' };
import { delimiter, join } from 'path';
import { execSync } from 'child_process';
import { createAnvilClients } from './anvil-clients';

const proolPromise = import('prool');
const proolInstancesPromise = import('prool/instances');

type CreateServerType = Awaited<typeof proolPromise>['createServer'];
type ProolServerReturnType = ReturnType<CreateServerType>;

type Hex = `0x${string}`;

const PORT = 8545;
const HOST = '127.0.0.1';
const CHAIN_ID = 1337;

const defaultOptions: Partial<AnvilParameters> = {
  balance: 25,
  chainId: CHAIN_ID,
  gasLimit: 30000000,
  gasPrice: 2000000000,
  hardfork: 'Prague',
  host: HOST,
  mnemonic:
    'spread raise short crane omit tent fringe mandate neglect detail suspect cradle',
  port: PORT,
};

export class Anvil {
  #server: ProolServerReturnType | undefined;

  #options: AnvilParameters | undefined;

  async start(
    opts: Partial<AnvilParameters> = {},
  ): Promise<void> {
    const options: AnvilParameters = {
      ...defaultOptions,
      ...opts,
    };

    // Set blockTime if noMining is disabled, as those 2 options are incompatible
    if (!opts.noMining && !opts.blockTime) {
      options.blockTime = 2;
    }

    this.#options = options;

    // Determine the path to the anvil binary directory
    const anvilBinaryDir = join(process.cwd(), 'node_modules', '.bin');

    // Prepend the anvil binary directory to the PATH environment variable
    process.env.PATH = `${anvilBinaryDir}${delimiter}${process.env.PATH}`;

    // Verify that the anvil binary is accessible
    try {
      const versionOutput = execSync('anvil --version', { encoding: 'utf-8' });
      console.log(`Anvil version: ${versionOutput}`);
      console.log(
        `Anvil server started on port: ${this.#options.port} with chainId: ${this.#options.chainId}`,
      );
    } catch (error) {
      console.error('Failed to execute anvil:', error);
      throw new Error('Anvil binary is not accessible.');
    }

    const { createServer } = await proolPromise;
    const { anvil } = await proolInstancesPromise;

    const anvilInstance = anvil(this.#options);

    this.#server = createServer({
      instance: anvilInstance,
      host: this.#options.host ?? HOST,
      port: this.#options.port ?? PORT,
    });
    await this.#server.start();
  }

  getProvider() {
    if (!this.#server || !this.#options) {
      throw new Error('Server not running or options not set yet');
    }
    const instance = {
      host: this.#options.host ?? defaultOptions.host!,
      port: this.#options.port ?? defaultOptions.port!,
    };

    // Pass the correct chainId and port from stored options
    const { walletClient, publicClient, testClient } = createAnvilClients(
      instance,
      this.#options.chainId ?? CHAIN_ID,
      instance.port ?? PORT,
    );

    return { walletClient, publicClient, testClient };
  }

  async getAccounts(): Promise<string[]> {
    const provider = this.getProvider();

    const { walletClient } = provider;
    const accounts = await walletClient.getAddresses();
    return accounts;
  }

  async getBalance(address: Hex | null = null): Promise<number> {
    const provider = this.getProvider();

    if (!provider) {
      console.log('No provider found');
      return 0;
    }
    const { publicClient } = provider;

    const accountToUse = address || (await this.getAccounts())?.[0];

    if (!accountToUse) {
      console.log('No accounts found');
      return 0;
    }

    const balance = await publicClient.getBalance({
      address: accountToUse as Hex,
    });
    const balanceFormatted = Number(balance) / 10 ** 18;

    // Round to four decimal places, so we return the same value as ganache does
    const balanceRounded = parseFloat(balanceFormatted.toFixed(4));
    return balanceRounded;
  }

  async getCode(address: Hex): Promise<Hex | undefined> {
    const provider = this.getProvider();

    if (!provider) {
      console.log('No provider found');
      return undefined;
    }
    const { publicClient } = provider;

    const bytecode = await publicClient.getCode({
      address,
    });
    return bytecode;
  }

  async getFiatBalance(): Promise<number> {
    const balance = await this.getBalance();
    const currencyConversionRate = 1700.0;
    const fiatBalance = (balance * currencyConversionRate).toFixed(2);

    return Number(fiatBalance);
  }

  async setAccountBalance(address: Hex, balance: string): Promise<void> {
    const provider = this.getProvider();
    const { testClient } = provider;

    const balanceInWei = BigInt(balance);
    await testClient.setBalance({
      address,
      value: balanceInWei,
    });
  }

  async mineBlock(): Promise<void> {
    const provider = this.getProvider();
    const { testClient } = provider;
    await testClient.mine({ blocks: 1 });
  }

  async quit(): Promise<void> {
    if (!this.#server) {
      throw new Error('Server not running yet');
    }
    try {
      await this.#server.stop();
    } catch (e) {
      console.log('Caught error while closing Anvil network:', e);
    }
  }
}
