/**
 * @file node.ts — Stellar local node seeder
 *
 * Starts `stellar/quickstart --local` in Docker. The documented CLI is
 * `docker run -i -p 8000:8000 stellar/quickstart --local`. This class uses the
 * detached equivalent (`-d --name`) so the E2E fixture can keep running, and
 * maps container 8000 to an ephemeral host port (host 8000 is the mockttp
 * HTTPS proxy).
 *
 * Friendbot funds accounts. Read paths do not depend on the local network
 * passphrase; transaction submit would, and is out of scope here.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { assertValidPort, getAvailablePorts } from '../ports';

const execFileAsync = promisify(execFile);

export const STELLAR_LOCAL_NODE_HOST = '127.0.0.1';
export const STELLAR_QUICKSTART_IMAGE =
  process.env.STELLAR_QUICKSTART_IMAGE ?? 'stellar/quickstart';

const { STELLAR_QUICKSTART_PLATFORM } = process.env;
const DOCKER_RUN_TIMEOUT_MS = 600_000;
const DOCKER_INFO_TIMEOUT_MS = 10_000;
const DEFAULT_READY_TIMEOUT_MS = 240_000;
const DEFAULT_FUND_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;
const HTTP_TIMEOUT_MS = 5_000;
const RPC_PATHS = ['/rpc', '/soroban/rpc'] as const;

export type StellarLocalNodeOptions = {
  horizonPort?: number;
  image?: string;
};

/* eslint-disable @typescript-eslint/naming-convention */
export type StellarHorizonBalance = {
  asset_type: string;
  balance: string;
};

export type StellarHorizonAccount = {
  account_id: string;
  balances: StellarHorizonBalance[];
  sequence: string;
};
/* eslint-enable @typescript-eslint/naming-convention */

export class StellarNode {
  #containerName: string | undefined;

  #horizonPort: number | undefined;

  #rpcPath: (typeof RPC_PATHS)[number] = '/rpc';

  get horizonUrl(): string {
    return `http://${STELLAR_LOCAL_NODE_HOST}:${this.#requirePort()}`;
  }

  get rpcUrl(): string {
    return `${this.horizonUrl}${this.#rpcPath}`;
  }

  async start(options: StellarLocalNodeOptions = {}): Promise<void> {
    if (this.#containerName || this.#horizonPort) {
      throw new Error('Stellar local node has already started');
    }

    try {
      await assertDockerAvailable();
      const horizonPort = await resolveHorizonPort(options.horizonPort);
      const containerName = `stellar-e2e-${process.pid}-${Date.now()}`;
      const image = options.image ?? STELLAR_QUICKSTART_IMAGE;
      const dockerArgs = [
        'run',
        '-d',
        '--name',
        containerName,
        '-p',
        `${STELLAR_LOCAL_NODE_HOST}:${horizonPort}:8000`,
      ];
      if (STELLAR_QUICKSTART_PLATFORM) {
        dockerArgs.push('--platform', STELLAR_QUICKSTART_PLATFORM);
      }
      dockerArgs.push(image, '--local');

      await execFileAsync('docker', dockerArgs, {
        timeout: DOCKER_RUN_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      });

      this.#containerName = containerName;
      this.#horizonPort = horizonPort;
      await this.waitForReady();
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async fundAccount(
    address: string,
    timeoutMs = DEFAULT_FUND_TIMEOUT_MS,
  ): Promise<StellarHorizonAccount> {
    const deadline = Date.now() + timeoutMs;
    let lastError: unknown;

    while (Date.now() < deadline) {
      try {
        const friendbotUrl = `${this.horizonUrl}/friendbot?addr=${encodeURIComponent(
          address,
        )}`;
        const response = await fetchJson(friendbotUrl, { timeoutMs: 15_000 });
        if (response.statusCode >= 500) {
          lastError = new Error(
            `Friendbot returned ${response.statusCode} for ${address}`,
          );
        } else {
          const account = await this.getAccount(address);
          if (account) {
            return account;
          }
          lastError = new Error(
            `Friendbot responded ${response.statusCode} but Horizon has no account ${address}`,
          );
        }
      } catch (error) {
        lastError = error;
      }
      await wait(POLL_INTERVAL_MS);
    }

    throw new Error(
      `Failed to fund Stellar account ${address} within ${timeoutMs}ms${formatUnknownError(
        lastError,
      )}`,
    );
  }

  async getAccount(address: string): Promise<StellarHorizonAccount | undefined> {
    const response = await fetchJson(
      `${this.horizonUrl}/accounts/${encodeURIComponent(address)}`,
    );
    if (response.statusCode === 404) {
      return undefined;
    }
    if (response.statusCode !== 200 || !isHorizonAccount(response.json)) {
      throw new Error(
        `Horizon GET /accounts/${address} returned ${response.statusCode}`,
      );
    }
    return response.json;
  }

  getNativeXlmBalance(account: StellarHorizonAccount): string {
    const native = account.balances.find(
      (balance) => balance.asset_type === 'native',
    );
    if (!native) {
      throw new Error(
        `Horizon account ${account.account_id} has no native XLM balance`,
      );
    }
    return native.balance;
  }

  async waitForReady(timeoutMs = DEFAULT_READY_TIMEOUT_MS): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastError: unknown;

    while (Date.now() < deadline) {
      await this.#throwIfContainerExited();
      try {
        const ledgers = await fetchJson(`${this.horizonUrl}/ledgers?limit=1`);
        if (ledgers.statusCode === 200 && hasLedgerRecords(ledgers.json)) {
          const rpcPath = await this.#detectRpcPath();
          if (rpcPath) {
            this.#rpcPath = rpcPath;
            return;
          }
          lastError = new Error('Horizon is up but Soroban RPC is not healthy');
        } else {
          lastError = new Error(
            `Horizon /ledgers returned ${ledgers.statusCode}`,
          );
        }
      } catch (error) {
        lastError = error;
      }
      await wait(POLL_INTERVAL_MS);
    }

    const logs = await this.#containerLogs();
    throw new Error(
      `Stellar Quickstart did not become ready within ${timeoutMs}ms${formatUnknownError(
        lastError,
      )}${logs ? `\n--- docker logs ---\n${logs}` : ''}`,
    );
  }

  async quit(): Promise<void> {
    const containerName = this.#containerName;
    this.#containerName = undefined;
    this.#horizonPort = undefined;
    this.#rpcPath = '/rpc';

    if (!containerName) {
      return;
    }

    try {
      await execFileAsync('docker', ['rm', '-f', containerName], {
        timeout: 30_000,
      });
    } catch {
      // Container may already have been removed.
    }
  }

  async #detectRpcPath(): Promise<(typeof RPC_PATHS)[number] | undefined> {
    for (const path of RPC_PATHS) {
      try {
        const response = await fetchJson(`${this.horizonUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth',
          }),
        });
        if (response.statusCode === 200 && isRpcHealthy(response.json)) {
          return path;
        }
      } catch {
        // Try the next known RPC path.
      }
    }
    return undefined;
  }

  async #throwIfContainerExited(): Promise<void> {
    if (!this.#containerName) {
      throw new Error('Stellar local node has not started');
    }

    const { stdout } = await execFileAsync(
      'docker',
      ['inspect', '-f', '{{.State.Running}}', this.#containerName],
      { timeout: 10_000 },
    );
    if (stdout.trim() !== 'true') {
      const logs = await this.#containerLogs();
      throw new Error(
        `Stellar Quickstart container ${this.#containerName} is not running${
          logs ? `\n--- docker logs ---\n${logs}` : ''
        }`,
      );
    }
  }

  async #containerLogs(): Promise<string> {
    if (!this.#containerName) {
      return '';
    }
    try {
      const { stdout, stderr } = await execFileAsync(
        'docker',
        ['logs', '--tail', '80', this.#containerName],
        { timeout: 10_000 },
      );
      return `${stdout}${stderr}`.trim();
    } catch {
      return '';
    }
  }

  #requirePort(): number {
    if (!this.#horizonPort) {
      throw new Error('Stellar local node has not started');
    }
    return this.#horizonPort;
  }
}

export async function assertDockerAvailable(): Promise<void> {
  try {
    await execFileAsync('docker', ['info'], {
      timeout: DOCKER_INFO_TIMEOUT_MS,
    });
  } catch (error) {
    throw new Error(
      `Docker is required for the Stellar Quickstart local node${formatUnknownError(
        error,
      )}`,
    );
  }
}

export async function isDockerAvailable(): Promise<boolean> {
  try {
    await assertDockerAvailable();
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a Horizon native balance string the way the token list does
 * (`formatTokenQuantity` / `en-US` grouping, no trailing zeros).
 *
 * @param horizonBalance - Horizon decimal XLM string, e.g. `10000.0000000`
 * @returns Token-list amount without the symbol, e.g. `10,000`
 */
export function formatXlmTokenListAmount(horizonBalance: string): string {
  const amount = Number(horizonBalance);
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid Horizon XLM balance: ${horizonBalance}`);
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 7,
  }).format(amount);
}

async function resolveHorizonPort(requestedPort?: number): Promise<number> {
  if (requestedPort !== undefined) {
    assertValidPort(requestedPort, 'Stellar Horizon port');
    return requestedPort;
  }
  const [port] = await getAvailablePorts(1);
  return port;
}

function isHorizonAccount(value: unknown): value is StellarHorizonAccount {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const account = value as Partial<StellarHorizonAccount>;
  return (
    typeof account.account_id === 'string' &&
    typeof account.sequence === 'string' &&
    Array.isArray(account.balances)
  );
}

function hasLedgerRecords(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { _embedded: embedded } = value as {
    _embedded?: { records?: unknown };
  };
  return Array.isArray(embedded?.records) && embedded.records.length > 0;
}

function isRpcHealthy(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { result } = value as { result?: { status?: string } };
  return result?.status === 'healthy';
}

type FetchJsonResult = {
  json: unknown;
  statusCode: number;
};

async function fetchJson(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<FetchJsonResult> {
  const { timeoutMs = HTTP_TIMEOUT_MS, ...requestInit } = init;
  const response = await fetch(url, {
    ...requestInit,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let json: unknown = text;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }
  return { statusCode: response.status, json };
}

function formatUnknownError(error: unknown): string {
  if (!error) {
    return '';
  }
  if (error instanceof Error) {
    return `: ${error.message}`;
  }
  return `: ${String(error)}`;
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
