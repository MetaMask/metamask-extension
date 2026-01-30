import type { Mockttp } from 'mockttp';
import type { MockServerCapability } from '@metamask/client-mcp-core';
import { fetchWithTimeout, retryUntil } from '@metamask/client-mcp-core';
import { MockServer } from '../mock-server';

export type MetaMaskMockServerCapabilityOptions = {
  enabled?: boolean;
  port?: number;
  testSpecificMock?: (mockServer: Mockttp) => Promise<void>;
  fetchWithTimeout?: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;
};

export class MetaMaskMockServerCapability implements MockServerCapability {
  private server: MockServer | undefined;

  private readonly enabled: boolean;

  private readonly port?: number;

  private readonly testSpecificMock?: (mockServer: Mockttp) => Promise<void>;

  private readonly fetchWithTimeout: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;

  constructor(options: MetaMaskMockServerCapabilityOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.port = options.port;
    this.testSpecificMock = options.testSpecificMock;
    this.fetchWithTimeout = options.fetchWithTimeout ?? fetchWithTimeout;
  }

  async start(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    if (this.server) {
      return;
    }

    this.server = new MockServer({ port: this.port });
    await this.server.start();
    await this.waitForReady();
    await this.server.setupDefaultMocks();

    if (this.testSpecificMock) {
      await this.testSpecificMock(this.server.getServer());
    }
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    await this.server.stop();
    this.server = undefined;
  }

  isRunning(): boolean {
    return Boolean(this.server);
  }

  getServer(): Mockttp {
    if (!this.server) {
      throw new Error('Mock server not started. Call start() first.');
    }

    return this.server.getServer();
  }

  getPort(): number {
    if (!this.server) {
      throw new Error('Mock server not started. Call start() first.');
    }

    return this.server.getPort();
  }

  private async waitForReady(maxAttempts = 10): Promise<void> {
    if (!this.server) {
      return;
    }

    const port = this.server.getPort();
    const response = await retryUntil(
      async () => {
        try {
          const result = await this.fetchWithTimeout(
            `https://localhost:${port}/`,
            { method: 'GET' },
            3000,
          );
          return result;
        } catch (e) {
          const error = e as Error;
          if (
            (error.cause && String(error.cause).includes('ECONNREFUSED')) ||
            error.name === 'AbortError'
          ) {
            return null;
          }
          return { ok: true } as Response;
        }
      },
      (result) => result !== null,
      { attempts: maxAttempts, delayMs: 200 },
    );

    if (response) {
      return;
    }

    throw new Error(
      `MockServer failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
  }
}
