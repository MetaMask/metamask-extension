import fs from 'fs';
import path from 'path';
import net from 'net';
import { withRetry, isRetryableError } from './resilience';
import { SPECULOS_APDU_PORT, SPECULOS_API_PORT } from './constants';

export type SpeculosClientOptions = {
  apduHost?: string;
  apduPort?: number;
  apiHost?: string;
  apiPort?: number;
  timeout?: number;
};

export type APDUResponse = {
  data: string;
};

export class SpeculosClient {
  private apduSocket: net.Socket | null = null;

  private baseUrl: string;

  private options: Required<SpeculosClientOptions>;

  private isConnected = false;

  private _healthy = false;

  private exchangeChain: Promise<void> = Promise.resolve();

  constructor(options: SpeculosClientOptions = {}) {
    this.options = {
      apduHost: '127.0.0.1',
      apduPort: SPECULOS_APDU_PORT,
      apiHost: '127.0.0.1',
      apiPort: SPECULOS_API_PORT,
      timeout: 30000,
      ...options,
    };

    if (process.env.SPECULOS_HOST) {
      this.options.apduHost = process.env.SPECULOS_HOST;
      this.options.apiHost = process.env.SPECULOS_HOST;
    }
    if (process.env.SPECULOS_APDU_PORT) {
      this.options.apduPort = Number(process.env.SPECULOS_APDU_PORT);
    }
    if (process.env.SPECULOS_API_PORT) {
      this.options.apiPort = Number(process.env.SPECULOS_API_PORT);
    }

    this.baseUrl = `http://${this.options.apiHost}:${this.options.apiPort}`;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.apduSocket = net.createConnection({
        host: this.options.apduHost,
        port: this.options.apduPort,
      });

      this.apduSocket.on('connect', () => {
        console.log('[SpeculosClient] Connected');
        this.isConnected = true;
        this._healthy = true;
        resolve();
      });

      this.apduSocket.on('error', (err) => {
        console.error('[SpeculosClient] Connection error:', err);
        this._healthy = false;
        reject(err);
      });

      this.apduSocket.on('close', () => {
        this.isConnected = false;
        this._healthy = false;
      });
    });
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    if (!this.apduSocket || !this.isConnected) {
      throw new Error('Not connected to Speculos');
    }

    let releaseMutex: () => void = () => undefined;
    const mutexSlot = new Promise<void>((resolve) => {
      releaseMutex = resolve;
    });
    // Swallow any prior rejection so a single failed exchange does not
    // permanently break the chain for subsequent callers.
    const prior = this.exchangeChain.catch(() => undefined);
    this.exchangeChain = prior.then(() => mutexSlot);

    await prior;

    try {
      return await this.exchangeOnce(apdu);
    } finally {
      releaseMutex();
    }
  }

  private async exchangeOnce(apdu: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let timeoutId: NodeJS.Timeout | undefined;
      let cleanup: () => void;

      const onData = (data: Buffer) => {
        chunks.push(data);
        const combined = Buffer.concat(chunks);

        if (combined.length < 4) {
          return;
        }
        const payloadSize = combined.readUInt32BE(0);
        const expectedTotal = 4 + payloadSize + 2;
        if (combined.length < expectedTotal) {
          return;
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        cleanup();
        resolve(combined.subarray(4, expectedTotal));
      };

      const onError = (err: Error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        cleanup();
        reject(err);
      };

      cleanup = () => {
        if (this.apduSocket) {
          this.apduSocket.off('data', onData);
          this.apduSocket.off('error', onError);
        }
      };

      if (!this.apduSocket) {
        reject(new Error('APDU socket not initialized'));
        return;
      }
      this.apduSocket.on('data', onData);
      this.apduSocket.on('error', onError);

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('APDU exchange timeout'));
      }, this.options.timeout);

      const lengthHeader = Buffer.alloc(4);
      lengthHeader.writeUInt32BE(apdu.length, 0);
      this.apduSocket.write(Buffer.concat([lengthHeader, apdu]));
    });
  }

  private async fetch(
    urlPath: string,
    options: RequestInit & { timeout?: number } = {},
  ): Promise<Response> {
    const { timeout: ms = this.options.timeout, ...init } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(`${this.baseUrl}${urlPath}`, {
        ...init,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(
          `Speculos API ${urlPath} returned ${response.status}: ${await response.text().catch(() => '')}`,
        );
      }
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  async pressButton(button: 'left' | 'right' | 'both'): Promise<void> {
    await this.fetch(`/button/${button}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'press-and-release' }),
    });
  }

  async fingerTap(x: number, y: number, delay = 0.1): Promise<void> {
    await this.fetch('/finger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'press-and-release', x, y, delay }),
    });
  }

  async fingerSwipe(
    x: number,
    y: number,
    x2: number,
    y2: number,
    delay = 0.3,
  ): Promise<void> {
    await this.fetch('/finger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'press-and-release', x, y, x2, y2, delay }),
    });
  }

  async getScreenshot(): Promise<Buffer> {
    const response = await this.fetch('/screenshot');
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async saveScreenshot(
    name: string,
    dir = 'test-artifacts/speculos-screenshots',
  ): Promise<string> {
    const screenshot = await this.getScreenshot();
    await fs.promises.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${name}-${Date.now()}.png`);
    await fs.promises.writeFile(filePath, screenshot);
    return filePath;
  }

  async sendAPDU(data: string): Promise<APDUResponse> {
    const response = await this.fetch('/apdu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    return response.json();
  }

  async disconnect(): Promise<void> {
    if (this.apduSocket) {
      this.apduSocket.end();
      this.apduSocket = null;
      this.isConnected = false;
      this._healthy = false;
    }
  }

  // Resilience helpers
  async connectWithResilience(options?: {
    autoReconnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelayMs?: number;
  }): Promise<void> {
    const autoReconnect = options?.autoReconnect ?? true;
    const maxReconnects = options?.reconnectAttempts ?? 5;
    const delay = options?.reconnectDelayMs ?? 1000;

    if (this.isConnected) {
      return;
    }

    let attempts = 0;
    // Try initial connect, then retry on failure if allowed
    while (!this.isConnected && attempts <= maxReconnects) {
      try {
        await this.connect();
      } catch (err) {
        attempts += 1;
        if (!autoReconnect || attempts > maxReconnects) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }

  async exchangeWithRetry(apdu: Buffer, maxAttempts = 3): Promise<Buffer> {
    const anyFn = async () => this.exchange(apdu);
    // Retry on retryable errors
    return withRetry<Buffer>(anyFn, {
      maxRetries: maxAttempts - 1,
      shouldRetry: (e) => isRetryableError(e),
      onRetry: (e, at) => {
        console.warn(
          `[SpeculosClient] APDU exchange retry ${at} due to: ${e?.message ?? e}`,
        );
      },
    });
  }

  isHealthy(): boolean {
    return this.isConnected && this._healthy;
  }
}
