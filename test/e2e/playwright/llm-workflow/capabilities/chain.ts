/* eslint-disable no-empty-function */
import { fetchWithTimeout, retryUntil } from '@metamask/client-mcp-core';
import type { ChainCapability } from '@metamask/client-mcp-core';
import { Anvil } from '../../../seeder/anvil';

export type MetaMaskChainCapabilityOptions = {
  port?: number;
  chainId?: number;
  forkUrl?: string;
  forkBlockNumber?: number;
  fetchWithTimeout?: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;
};

export type NoOpChainCapabilityOptions = {
  rpcUrl: string;
  chainId?: number;
  port?: number;
};

/**
 * No-operation chain capability for production mode.
 * Implements ChainCapability but does NOT start/stop local nodes.
 * start() and stop() are no-ops; isRunning() always returns true.
 */
export class NoOpChainCapability implements ChainCapability {
  private readonly rpcUrl: string;

  private readonly chainId: number;

  private port: number;

  constructor(options: NoOpChainCapabilityOptions) {
    if (!options.rpcUrl) {
      throw new Error('NoOpChainCapability requires rpcUrl to be provided');
    }
    this.rpcUrl = options.rpcUrl;
    this.chainId = options.chainId ?? 1;
    this.port = options.port ?? 0;
  }

  async start(): Promise<void> {
    console.log(
      `[NoOpChainCapability] Using remote chain: ${this.rpcUrl} (chainId: ${this.chainId})`,
    );
  }

  async stop(): Promise<void> {}

  isRunning(): boolean {
    return true;
  }

  setPort(port: number): void {
    this.port = port;
  }
}

export class MetaMaskChainCapability implements ChainCapability {
  private anvil: Anvil | undefined;

  private port: number;

  private readonly chainId: number;

  private readonly forkUrl?: string;

  private readonly forkBlockNumber?: number;

  private readonly fetchWithTimeout: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;

  constructor(options: MetaMaskChainCapabilityOptions = {}) {
    this.port = options.port ?? 8545;
    this.chainId = options.chainId ?? 1337;
    this.forkUrl = options.forkUrl;
    this.forkBlockNumber = options.forkBlockNumber;
    this.fetchWithTimeout = options.fetchWithTimeout ?? fetchWithTimeout;
  }

  async start(): Promise<void> {
    console.log('Starting Anvil...');
    this.anvil = new Anvil();

    const anvilOptions: {
      port: number;
      chainId: number;
      forkUrl?: string;
      forkBlockNumber?: number;
    } = {
      port: this.port,
      chainId: this.chainId,
    };

    if (this.forkUrl) {
      anvilOptions.forkUrl = this.forkUrl;
      if (this.forkBlockNumber) {
        anvilOptions.forkBlockNumber = this.forkBlockNumber;
      }
    }

    await this.anvil.start(anvilOptions);
    await this.waitForReady();
    console.log(
      `Anvil started on port ${this.port} with chainId ${this.chainId}`,
    );
  }

  async stop(): Promise<void> {
    if (!this.anvil) {
      return;
    }

    await this.anvil.quit();
    this.anvil = undefined;
  }

  isRunning(): boolean {
    return this.anvil !== undefined;
  }

  getAnvil(): Anvil | undefined {
    return this.anvil;
  }

  setPort(port: number): void {
    this.port = port;
  }

  private async waitForReady(maxAttempts = 20): Promise<void> {
    const response = await retryUntil(
      () =>
        this.fetchWithTimeout(
          `http://localhost:${this.port}`,
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
        console.log('Anvil is ready');
        return;
      }
    }

    throw new Error(
      `Anvil failed to respond after ${maxAttempts} attempts on port ${this.port}. ` +
        `To kill any orphan process: lsof -ti:${this.port} | xargs kill -9`,
    );
  }
}
