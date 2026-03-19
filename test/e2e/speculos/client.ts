import net from 'net';
import axios, { AxiosInstance } from 'axios';

export interface SpeculosClientOptions {
  apduHost?: string;
  apduPort?: number;
  apiHost?: string;
  apiPort?: number;
  timeout?: number;
}

export interface APDUResponse {
  data: string; // Hex string
}

export class SpeculosClient {
  private apduSocket: net.Socket | null = null;
  private api: AxiosInstance;
  private options: Required<SpeculosClientOptions>;
  private isConnected = false;

  constructor(options: SpeculosClientOptions = {}) {
    this.options = {
      apduHost: '127.0.0.1',
      apduPort: 9999,
      apiHost: '127.0.0.1',
      apiPort: 5000,
      timeout: 30000,
      ...options,
    };

    this.api = axios.create({
      baseURL: `http://${this.options.apiHost}:${this.options.apiPort}`,
      timeout: this.options.timeout,
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    return new Promise((resolve, reject) => {
      this.apduSocket = net.createConnection({
        host: this.options.apduHost,
        port: this.options.apduPort,
      });

      this.apduSocket.on('connect', () => {
        console.log('[SpeculosClient] Connected');
        this.isConnected = true;
        resolve();
      });

      this.apduSocket.on('error', (err) => {
        console.error('[SpeculosClient] Connection error:', err);
        reject(err);
      });

      this.apduSocket.on('close', () => {
        this.isConnected = false;
      });
    });
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    if (!this.apduSocket || !this.isConnected) {
      throw new Error('Not connected to Speculos');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let timeoutId: NodeJS.Timeout;

      const onData = (data: Buffer) => {
        chunks.push(data);
        const combined = Buffer.concat(chunks);

        // Check if response is complete (minimum 2 bytes for status)
        if (combined.length >= 2) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(combined);
        }
      };

      const onError = (err: Error) => {
        clearTimeout(timeoutId);
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        this.apduSocket!.off('data', onData);
        this.apduSocket!.off('error', onError);
      };

      this.apduSocket.on('data', onData);
      this.apduSocket.on('error', onError);

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('APDU exchange timeout'));
      }, this.options.timeout);

      // Send APDU
      this.apduSocket.write(apdu);
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
    }
  }

  /**
   * Send automation rules to Speculos
   * @param rules Automation rules object
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
