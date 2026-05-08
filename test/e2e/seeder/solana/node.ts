import { spawn, type ChildProcess } from 'child_process';
import { mkdir, mkdtemp, rm } from 'fs/promises';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const SOLANA_NODE_PROCESS_OUTPUT_LIMIT = 8_000;

export const LAMPORTS_PER_SOL = 1_000_000_000;

export type SolanaLocalNodeOptions = {
  initialBalances?: Record<string, number>;
};

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

type JsonRpcResponse<ResponseBody> = {
  error?: { code: number; message: string };
  result?: ResponseBody;
};

export class SolanaNode {
  #nodeProcess: ChildProcess | undefined;

  #nodeProcessExitError: Error | undefined;

  #rpcPort: number | undefined;

  #runtimeDirectory: string | undefined;

  #stderr = '';

  #stdout = '';

  get baseUrl(): string {
    if (!this.#rpcPort) {
      throw new Error('Solana local node has not started');
    }
    return `http://127.0.0.1:${this.#rpcPort}`;
  }

  async start(options: SolanaLocalNodeOptions = {}): Promise<void> {
    try {
      await this.#startNativeSolanaValidator();
      await this.waitForReady(120_000);

      for (const [address, lamports] of Object.entries(
        options.initialBalances ?? {},
      )) {
        if (lamports > 0) {
          await this.requestAirdrop(address, lamports);
          await this.waitForBalance(address, lamports, 60_000);
        }
      }
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async #startNativeSolanaValidator(): Promise<void> {
    await this.#runPackageBinary('solana-test-validator-up', ['install']);

    const runtimeDirectory = await mkdtemp(join(tmpdir(), 'solana-e2e-'));
    const ledgerDirectory = join(runtimeDirectory, 'ledger');
    const { dynamicPortRange, faucetPort, gossipPort, rpcPort } =
      await getSolanaValidatorPorts();
    await mkdir(ledgerDirectory, { recursive: true });

    this.#rpcPort = rpcPort;
    this.#runtimeDirectory = runtimeDirectory;
    this.#nodeProcessExitError = undefined;
    this.#stderr = '';
    this.#stdout = '';

    const validatorBinary = getPackageBinaryPath('solana-test-validator');
    const nodeProcess = spawn(
      validatorBinary,
      [
        '--reset',
        '--quiet',
        '--ledger',
        ledgerDirectory,
        '--rpc-port',
        String(rpcPort),
        '--faucet-port',
        String(faucetPort),
        '--gossip-port',
        String(gossipPort),
        '--dynamic-port-range',
        dynamicPortRange,
        '--bind-address',
        '127.0.0.1',
      ],
      {
        cwd: runtimeDirectory,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    this.#nodeProcess = nodeProcess;
    nodeProcess.stdout?.on('data', (chunk: Buffer) => {
      this.#stdout = appendProcessOutput(this.#stdout, chunk);
    });
    nodeProcess.stderr?.on('data', (chunk: Buffer) => {
      this.#stderr = appendProcessOutput(this.#stderr, chunk);
    });
    nodeProcess.once('error', (error) => {
      this.#nodeProcessExitError = error;
    });
    nodeProcess.once('exit', (code, signal) => {
      this.#nodeProcessExitError = new Error(
        `solana-test-validator exited with code ${code ?? 'null'} and signal ${
          signal ?? 'null'
        }.${this.#formatProcessOutput()}`,
      );
    });
  }

  async #runPackageBinary(command: string, args: string[]): Promise<void> {
    const binaryPath = getPackageBinaryPath(command);

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child = spawn(binaryPath, args, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout = appendProcessOutput(stdout, chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr = appendProcessOutput(stderr, chunk);
      });
      child.once('error', rejectPromise);
      child.once('close', (code, signal) => {
        if (code === 0) {
          resolvePromise();
          return;
        }

        rejectPromise(
          new Error(
            `${command} ${args.join(' ')} exited with code ${
              code ?? 'null'
            } and signal ${signal ?? 'null'}.${formatProcessOutput(
              stdout,
              stderr,
            )}`,
          ),
        );
      });
    });
  }

  async quit(): Promise<void> {
    const nodeProcess = this.#nodeProcess;
    const runtimeDirectory = this.#runtimeDirectory;
    this.#nodeProcess = undefined;
    this.#runtimeDirectory = undefined;
    this.#rpcPort = undefined;

    if (nodeProcess) {
      await stopProcess(nodeProcess);
    }

    if (runtimeDirectory) {
      await rm(runtimeDirectory, { force: true, recursive: true });
    }
  }

  async waitForReady(timeoutMs = 60_000): Promise<void> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (this.#nodeProcessExitError) {
        throw this.#nodeProcessExitError;
      }

      try {
        const health = await this.request<string>('getHealth', [], {
          timeoutMs: 1_000,
        });
        if (health === 'ok') {
          return;
        }
      } catch {
        // The RPC port opens before the validator is fully ready.
      }

      await delay(500);
    }

    throw new Error(
      `Timed out waiting for solana-test-validator to start.${this.#formatProcessOutput()}`,
    );
  }

  async request<ResponseBody>(
    method: string,
    params: unknown[] = [],
    options: FetchJsonOptions = {},
  ): Promise<ResponseBody> {
    const response = await fetchJson<JsonRpcResponse<ResponseBody>>(
      this.baseUrl,
      {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify({
          id: 'e2e',
          jsonrpc: '2.0',
          method,
          params,
        }),
      },
    );

    if (response.error) {
      throw new Error(`Solana RPC ${method} failed: ${response.error.message}`);
    }

    return response.result as ResponseBody;
  }

  async requestAirdrop(address: string, lamports: number): Promise<string> {
    return await this.request<string>('requestAirdrop', [address, lamports]);
  }

  async getBalance(address: string): Promise<number> {
    const response = await this.request<{
      context: unknown;
      value: number;
    }>('getBalance', [address, { commitment: 'confirmed' }]);
    return response.value;
  }

  async waitForBalance(
    address: string,
    expectedMinimumLamports: number,
    timeoutMs = 30_000,
  ): Promise<void> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (this.#nodeProcessExitError) {
        throw this.#nodeProcessExitError;
      }

      if ((await this.getBalance(address)) >= expectedMinimumLamports) {
        return;
      }

      await delay(500);
    }

    throw new Error(
      `Timed out waiting for Solana account ${address} to reach ${expectedMinimumLamports} lamports.`,
    );
  }

  #formatProcessOutput(): string {
    return formatProcessOutput(this.#stdout, this.#stderr);
  }
}

async function fetchJson<ResponseBody>(
  url: string,
  { timeoutMs = 10_000, ...options }: FetchJsonOptions = {},
): Promise<ResponseBody> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await response.text();
    const json = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      throw new Error(
        `Request to ${url} failed with ${response.status}: ${text}`,
      );
    }

    return json as ResponseBody;
  } finally {
    clearTimeout(timeout);
  }
}

function getPackageBinaryPath(command: string): string {
  return resolve(process.cwd(), 'node_modules', '.bin', command);
}

async function getAvailablePort(): Promise<number> {
  return await new Promise((resolvePromise, rejectPromise) => {
    const server = createServer();
    server.unref();
    server.on('error', rejectPromise);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        rejectPromise(new Error('Unable to allocate an available port'));
        return;
      }
      const { port } = address;
      server.close(() => resolvePromise(port));
    });
  });
}

async function getSolanaValidatorPorts(): Promise<{
  dynamicPortRange: string;
  faucetPort: number;
  gossipPort: number;
  rpcPort: number;
}> {
  const portCount = 32;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = await getAvailablePort();
    const rpcPort = candidate;
    const lastPort = rpcPort + portCount - 1;

    if (lastPort > 65535) {
      continue;
    }

    if (await isTcpPortRangeAvailable(rpcPort, portCount)) {
      return {
        rpcPort,
        faucetPort: rpcPort + 2,
        gossipPort: rpcPort + 3,
        dynamicPortRange: `${rpcPort + 4}-${lastPort}`,
      };
    }
  }

  throw new Error(
    'Unable to allocate an available Solana validator port range',
  );
}

async function isTcpPortRangeAvailable(
  startPort: number,
  count: number,
): Promise<boolean> {
  const servers: ReturnType<typeof createServer>[] = [];

  try {
    for (let offset = 0; offset < count; offset += 1) {
      servers.push(await listenOnTcpPort(startPort + offset));
    }
    return true;
  } catch {
    return false;
  } finally {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((resolvePromise) => {
            server.close(() => resolvePromise());
          }),
      ),
    );
  }
}

async function listenOnTcpPort(port: number) {
  return await new Promise<ReturnType<typeof createServer>>(
    (resolvePromise, rejectPromise) => {
      const server = createServer();
      server.unref();
      server.once('error', rejectPromise);
      server.listen(port, '127.0.0.1', () => resolvePromise(server));
    },
  );
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode) {
    return;
  }

  await new Promise<void>((resolvePromise) => {
    const timeout = setTimeout(() => {
      try {
        if (process.platform !== 'win32' && child.pid) {
          process.kill(-child.pid, 'SIGKILL');
        } else {
          child.kill('SIGKILL');
        }
      } catch {
        // The process may already be gone.
      }
      resolvePromise();
    }, 5_000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolvePromise();
    });

    try {
      if (process.platform !== 'win32' && child.pid) {
        process.kill(-child.pid, 'SIGTERM');
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      clearTimeout(timeout);
      resolvePromise();
    }
  });
}

function appendProcessOutput(current: string, chunk: Buffer): string {
  const output = current + chunk.toString('utf8');
  return output.slice(-SOLANA_NODE_PROCESS_OUTPUT_LIMIT);
}

function formatProcessOutput(stdout: string, stderr: string): string {
  return `\nstdout:\n${stdout || '<empty>'}\nstderr:\n${stderr || '<empty>'}`;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
