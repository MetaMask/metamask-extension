import { delimiter, join } from 'path';
import { execSync } from 'child_process';
import { createAnvilClients } from './anvil-clients';
import type { AnvilParameters } from 'prool/instances' with { 'resolution-mode': 'import' };

const proolPromise = import('prool');
const proolInstancesPromise = import('prool/instances');

// Import AnvilParameters type from the main instances export with assertion

type CreateServerType = Awaited<typeof proolPromise>['createServer'];
type ProolServerReturnType = ReturnType<CreateServerType>;

type Hex = `0x${string}`;

// Define a configuration type combining Anvil parameters and proxy settings
type AnvilConfig = Pick<AnvilParameters,
  'balance' | 'chainId' | 'gasLimit' | 'gasPrice' | 'hardfork' | 'mnemonic' | 'blockTime' | 'noMining'
> & {
  host: string;
  port: number;
};

// Use the new AnvilConfig type for defaults
const defaultOptions: AnvilConfig = {
  balance: 25,
  chainId: 1337,
  gasLimit: 30000000,
  gasPrice: 2000000000,
  hardfork: 'Muirglacier',
  host: '127.0.0.1',
  mnemonic:
    'spread raise short crane omit tent fringe mandate neglect detail suspect cradle',
  port: 8545,
  noMining: false, // Keep for config, filter out before passing to anvil()
  blockTime: undefined, // Explicitly undefined initially
};

export class Anvil {
  #server: ProolServerReturnType | undefined;

  // Use the new AnvilConfig type for the stored options
  #options: AnvilConfig | undefined;

  async start(
    // Use the new AnvilConfig type for input opts
    opts: Partial<AnvilConfig> = {},
  ): Promise<void> {
    // Type of 'options' is now inferred as AnvilConfig
    const options = { ...defaultOptions, ...opts };
    this.#options = options; // Store the resolved options

    // Set blockTime conditionally (logic remains the same)
    if (!options.noMining && !options.blockTime) {
      options.blockTime = 2;
    }

    // Determine the path to the anvil binary directory
    const anvilBinaryDir = join(process.cwd(), 'node_modules', '.bin');

    // Prepend the anvil binary directory to the PATH environment variable
    process.env.PATH = `${anvilBinaryDir}${delimiter}${process.env.PATH}`;

    // Verify that the anvil binary is accessible
    try {
      const versionOutput = execSync('anvil --version', { encoding: 'utf-8' });
      console.log(`Anvil version: ${versionOutput}`);
      console.log(
        `Anvil server started on port: ${options.port} with chainId: ${options.chainId}`,
      );
    } catch (error) {
      console.error('Failed to execute anvil:', error);
      throw new Error('Anvil binary is not accessible.');
    }

    const { host, port, noMining: _noMining, blockTime, ...restOptions } = options;
    const anvilCliOptions: Partial<AnvilParameters> = { ...restOptions };

    // Only add blockTime to the object if it's a number
    if (typeof blockTime === 'number') {
        anvilCliOptions.blockTime = blockTime;
    }

    const { createServer } = await proolPromise;
    const { anvil } = await proolInstancesPromise;

    const anvilInstance = anvil(anvilCliOptions as AnvilParameters);

    this.#server = createServer({
      instance: anvilInstance,
      host,
      port,
    });
    await this.#server.start();
  }

  getProvider() {
    if (!this.#server || !this.#options) {
      throw new Error('Server not running or options not set yet');
    }
    const instance = {
      host: this.#options.host,
      port: this.#options.port,
    };

    // Pass the correct chainId and port from stored options
    const { walletClient, publicClient, testClient } = createAnvilClients(
      instance,
      this.#options.chainId ?? 1337,
      this.#options.port ?? 8545,
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
