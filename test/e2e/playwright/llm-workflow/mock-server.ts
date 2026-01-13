import * as mockttp from 'mockttp';
import type { Mockttp } from 'mockttp';

const DEFAULT_MOCK_PORT = 8000;

export type MockServerOptions = {
  port?: number;
};

export class MockServer {
  private server: Mockttp | null = null;

  private port: number;

  constructor(options: MockServerOptions = {}) {
    this.port = options.port ?? DEFAULT_MOCK_PORT;
  }

  async start(): Promise<void> {
    const https = await mockttp.generateCACertificate();
    this.server = mockttp.getLocal({ https, cors: true });
    await this.server.start(this.port);
    console.log(`MockServer running on port ${this.port}`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      this.server = null;
    }
  }

  getServer(): Mockttp {
    if (!this.server) {
      throw new Error('MockServer not started');
    }
    return this.server;
  }

  getPort(): number {
    return this.port;
  }

  async setupDefaultMocks(): Promise<void> {
    if (!this.server) {
      throw new Error('MockServer not started');
    }

    await this.server.forAnyRequest().thenPassThrough({
      beforeRequest: ({ headers: { host }, url: _url }) => {
        const blocklist = [
          'phishing-detection.api.cx.metamask.io',
          'sentry.io',
        ];

        if (blocklist.some((blocked) => host?.includes(blocked))) {
          return {
            response: {
              statusCode: 200,
              body: JSON.stringify({}),
            },
          };
        }
        return {};
      },
    });

    await this.mockGasApi();
    await this.mockTokenApi();
    await this.mockCurrencyApi();
  }

  private async mockGasApi(): Promise<void> {
    if (!this.server) {
      return;
    }

    await this.server.forGet(/gas\.api\.cx\.metamask\.io/u).thenJson(200, {
      low: { suggestedMaxPriorityFeePerGas: '1', suggestedMaxFeePerGas: '20' },
      medium: {
        suggestedMaxPriorityFeePerGas: '1.5',
        suggestedMaxFeePerGas: '25',
      },
      high: {
        suggestedMaxPriorityFeePerGas: '2',
        suggestedMaxFeePerGas: '30',
      },
      estimatedBaseFee: '15',
      networkCongestion: 0.5,
    });
  }

  private async mockTokenApi(): Promise<void> {
    if (!this.server) {
      return;
    }

    await this.server
      .forGet(/token\.api\.cx\.metamask\.io\/tokens/u)
      .thenJson(200, []);

    await this.server
      .forGet(/token\.api\.cx\.metamask\.io\/token/u)
      .thenJson(200, {});
  }

  private async mockCurrencyApi(): Promise<void> {
    if (!this.server) {
      return;
    }

    await this.server
      .forGet(/min-api\.cryptocompare\.com/u)
      .thenJson(200, { USD: 1700 });

    await this.server.forGet(/price\.api\.cx\.metamask\.io/u).thenJson(200, {
      prices: {
        '0x0000000000000000000000000000000000000000': {
          usd: 1700,
        },
      },
    });
  }

  async mockEndpoint(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    urlPattern: string | RegExp,
    response: { status?: number; body?: unknown },
  ): Promise<void> {
    if (!this.server) {
      throw new Error('MockServer not started');
    }

    const status = response.status ?? 200;
    const body = response.body ?? {};

    switch (method) {
      case 'GET':
        await this.server.forGet(urlPattern).thenJson(status, body);
        break;
      case 'POST':
        await this.server.forPost(urlPattern).thenJson(status, body);
        break;
      case 'PUT':
        await this.server.forPut(urlPattern).thenJson(status, body);
        break;
      case 'DELETE':
        await this.server.forDelete(urlPattern).thenJson(status, body);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${String(method)}`);
    }
  }
}

export { DEFAULT_MOCK_PORT };
