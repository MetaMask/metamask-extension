import type { NetworkConfig } from '../types';
import type { SmartContractName } from '../anvil-seeder-wrapper';
import { Anvil } from '../../../seeder/anvil';
import { AnvilSeederWrapper } from '../anvil-seeder-wrapper';
import { retryUntil } from './retry';

type AnvilServiceOptions = {
  network?: NetworkConfig;
  anvilPort: number;
  defaultChainId: number;
  seedContracts?: SmartContractName[];
  fetchWithTimeout: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;
  log: {
    info: (message: string) => void;
    error: (message: string, error?: unknown) => void;
  };
};

export class AnvilService {
  private anvil: Anvil | undefined;

  private seeder: AnvilSeederWrapper | undefined;

  private readonly options: AnvilServiceOptions;

  constructor(options: AnvilServiceOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    const { log } = this.options;

    log.info('Starting Anvil...');
    this.anvil = new Anvil();

    const port = this.getAnvilPort();
    const chainId = this.getChainId();

    const anvilOptions: {
      port: number;
      chainId: number;
      forkUrl?: string;
      forkBlockNumber?: number;
    } = {
      port,
      chainId,
    };

    if (this.options.network?.mode === 'fork' && this.options.network.rpcUrl) {
      anvilOptions.forkUrl = this.options.network.rpcUrl;
      if (this.options.network.forkBlockNumber) {
        anvilOptions.forkBlockNumber = this.options.network.forkBlockNumber;
      }
    }

    await this.anvil.start(anvilOptions);
    await this.waitForReady();

    this.seeder = new AnvilSeederWrapper(this.anvil.getProvider());
    log.info('AnvilSeeder initialized');
    log.info(`Anvil started on port ${port} with chainId ${chainId}`);

    await this.deploySeedContracts();
  }

  async stop(): Promise<void> {
    if (!this.anvil) {
      return;
    }

    await this.anvil.quit();
    this.anvil = undefined;
    this.seeder = undefined;
  }

  getSeeder(): AnvilSeederWrapper {
    if (!this.seeder) {
      throw new Error('Seeder not initialized. Ensure Anvil has started.');
    }
    return this.seeder;
  }

  private getAnvilPort(): number {
    if (
      this.options.network?.mode === 'custom' &&
      this.options.network.rpcUrl
    ) {
      const parsedPort = parseInt(
        new URL(this.options.network.rpcUrl).port,
        10,
      );
      return parsedPort || this.options.anvilPort;
    }
    return this.options.anvilPort;
  }

  private getChainId(): number {
    return this.options.network?.chainId ?? this.options.defaultChainId;
  }

  private async waitForReady(maxAttempts = 20): Promise<void> {
    const port = this.getAnvilPort();
    const { log, fetchWithTimeout } = this.options;

    const response = await retryUntil(
      () =>
        fetchWithTimeout(
          `http://localhost:${port}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1,
            }),
          },
          3000,
        ).catch(() => null),
      (result) => Boolean(result?.ok),
      { attempts: maxAttempts, delayMs: 500 },
    );

    if (response) {
      const data = await response.json().catch(() => null);
      if (data?.result !== undefined) {
        log.info('Anvil is ready');
        return;
      }
    }

    throw new Error(
      `Anvil failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
  }

  private async deploySeedContracts(): Promise<void> {
    const { seedContracts, log } = this.options;

    if (!seedContracts || seedContracts.length === 0) {
      return;
    }

    if (!this.seeder) {
      throw new Error('Seeder not initialized');
    }

    log.info(`Deploying ${seedContracts.length} seed contracts...`);

    for (const contractName of seedContracts) {
      try {
        const deployed = await this.seeder.deployContract(contractName);
        log.info(`  Deployed ${contractName} at ${deployed.address}`);
      } catch (error) {
        log.error(`  Failed to deploy ${contractName}:`, error);
        throw error;
      }
    }

    log.info('Seed contract deployment complete');
  }
}
