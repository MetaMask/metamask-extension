import net from 'net';
import axios, { AxiosInstance } from 'axios';
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
  data: string; // Hex string
};

export class SpeculosClient {
  private apduSocket: net.Socket | null = null;

  private api: AxiosInstance;

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

    this.api = axios.create({
      baseURL: `http://${this.options.apiHost}:${this.options.apiPort}`,
      timeout: this.options.timeout,
    });
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
      // eslint-disable-next-line prefer-const
      let timeoutId: NodeJS.Timeout | undefined;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define, prefer-const
      let cleanup: () => void;

      // Speculos TCP APDU wire format (speculos/mcu/apdu.py):
      //   request:  [4-byte BE length][apdu]
      //   response: [4-byte BE length=N][N payload bytes][2-byte SW]
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
        // Return payload + SW; strip the 4-byte length prefix.
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

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('APDU exchange timeout'));
      }, this.options.timeout);

      // Send framed APDU: [4-byte BE length][apdu]
      const lengthHeader = Buffer.alloc(4);
      lengthHeader.writeUInt32BE(apdu.length, 0);
      this.apduSocket.write(Buffer.concat([lengthHeader, apdu]));
    });
  }

  async pressButton(button: 'left' | 'right' | 'both'): Promise<void> {
    await this.api.post(`/button/${button}`, {
      action: 'press-and-release',
    });
  }

  async getScreenshot(): Promise<Buffer> {
    const response = await this.api.get('/screenshot', {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  async sendAPDU(data: string): Promise<APDUResponse> {
    const response = await this.api.post<APDUResponse>('/apdu', { data });
    return response.data;
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

  /**
   * Send automation rules to Speculos
   * @param rules - Automation rules object
   */
  async sendAutomationRules(rules: object): Promise<void> {
    await this.api.post('/automation', rules);
  }

  /**
   * Clear all automation rules
   */
  async clearAutomationRules(): Promise<void> {
    await this.api.delete('/automation');
  }
}
