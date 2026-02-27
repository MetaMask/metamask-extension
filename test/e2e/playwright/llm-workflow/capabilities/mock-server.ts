import type { MockServerCapability } from '@metamask/client-mcp-core';
import { fetchWithTimeout, retryUntil } from '@metamask/client-mcp-core';
import * as mockttp from 'mockttp';
import type { MockedEndpoint, Mockttp } from '../../../mock-e2e';
import { setupMocking } from '../../../mock-e2e';

const DEFAULT_MOCK_PORT = 8000;

const PROXY_INTERCEPT_EXACT_HOSTS = [
  'api.lens.dev',
  'api.segment.io',
  'bsc-dataseed.binance.org',
  'carrot.megaeth.com',
  'chainid.network',
  'cdnjs.cloudflare.com',
  'customnetwork.test',
  'etherscan.io',
  'mainnet.infura.io',
  'sentry.io',
  'sourcify.dev',
  'testnet-rpc.monad.xyz',
  'www.4byte.directory',
] as const;

const PROXY_INTERCEPT_DOMAIN_SUFFIXES = [
  '.api.cx.metamask.io',
  '.contentful.com',
  '.infura.io',
  '.ipfs.dweb.link',
  '.metamask.io',
  '.socket.tech',
] as const;

function escapePacString(value: string): string {
  return value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"');
}

function buildProxyPacScript(proxyServer: string): string {
  const escapedProxyServer = escapePacString(proxyServer);
  const exactHosts = PROXY_INTERCEPT_EXACT_HOSTS.map(
    (host) => `"${escapePacString(host)}": 1`,
  ).join(',\n    ');
  const suffixChecks = PROXY_INTERCEPT_DOMAIN_SUFFIXES.map((suffix) => {
    const escapedSuffix = escapePacString(suffix);
    const baseHost = escapePacString(suffix.slice(1));

    return `if (host === "${baseHost}" || dnsDomainIs(host, "${escapedSuffix}")) { return true; }`;
  }).join('\n    ');

  return `function FindProxyForURL(url, host) {
  if (!host) { return "DIRECT"; }

  var normalizedHost = host.toLowerCase();
  if (normalizedHost === "localhost" || shExpMatch(normalizedHost, "127.*") || shExpMatch(normalizedHost, "[::1]")) {
    return "DIRECT";
  }

  var exactHosts = {
    ${exactHosts}
  };

  function shouldProxy(host) {
    if (exactHosts[host]) { return true; }
    ${suffixChecks}
    return false;
  }

  if (shouldProxy(normalizedHost)) {
    return "PROXY ${escapedProxyServer}";
  }

  return "DIRECT";
}`;
}

export type MetaMaskMockServerCapabilityOptions = {
  enabled?: boolean;
  port?: number;
  chainId?: number;
  ethConversionInUsd?: string;
  testSpecificMock?: (mockServer: Mockttp) => Promise<void | MockedEndpoint[]>;
  fetchWithTimeout?: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;
};

export class MetaMaskMockServerCapability implements MockServerCapability {
  private server: Mockttp | undefined;

  private certificateSpkiFingerprint: string | undefined;

  private readonly enabled: boolean;

  private readonly port: number;

  private readonly chainId: number;

  private readonly ethConversionInUsd: string;

  private readonly testSpecificMock?: (
    mockServer: Mockttp,
  ) => Promise<void | MockedEndpoint[]>;

  private readonly fetchWithTimeout: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;

  constructor(options: MetaMaskMockServerCapabilityOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.port = options.port ?? DEFAULT_MOCK_PORT;
    this.chainId = options.chainId ?? 1337;
    this.ethConversionInUsd = options.ethConversionInUsd ?? '1700';
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

    const https = await mockttp.generateCACertificate();
    this.certificateSpkiFingerprint = mockttp.generateSPKIFingerprint(
      https.cert,
    );
    this.server = mockttp.getLocal({ https, cors: true });
    await this.server.start(this.port);
    console.log(`MockServer running on port ${this.port}`);
    await this.waitForReady();

    await setupMocking(
      this.server,
      async (mockServer) => {
        if (!this.testSpecificMock) {
          return [];
        }

        const mockedEndpoints = await this.testSpecificMock(mockServer);
        return Array.isArray(mockedEndpoints) ? mockedEndpoints : [];
      },
      {
        chainId: this.chainId.toString(),
        ethConversionInUsd: this.ethConversionInUsd,
      },
    );
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    await this.server.stop();
    this.server = undefined;
    this.certificateSpkiFingerprint = undefined;
  }

  isRunning(): boolean {
    return Boolean(this.server);
  }

  getServer(): Mockttp {
    if (!this.server) {
      throw new Error('Mock server not started. Call start() first.');
    }

    return this.server;
  }

  getPort(): number {
    if (!this.server) {
      throw new Error('Mock server not started. Call start() first.');
    }

    return this.port;
  }

  getCertificateSpkiFingerprint(): string | undefined {
    return this.certificateSpkiFingerprint;
  }

  getProxyPacScript(proxyServer: string): string {
    return buildProxyPacScript(proxyServer);
  }

  private async waitForReady(maxAttempts = 10): Promise<void> {
    if (!this.server) {
      return;
    }

    const response = await retryUntil(
      async () => {
        try {
          const result = await this.fetchWithTimeout(
            `https://localhost:${this.port}/`,
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
      `MockServer failed to respond after ${maxAttempts} attempts on port ${this.port}. ` +
        `To kill any orphan process: lsof -ti:${this.port} | xargs kill -9`,
    );
  }
}
