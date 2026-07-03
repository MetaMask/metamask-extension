/**
 * @file node.ts — Solana local node seeder
 *
 * The local node runs a native `solana-test-validator`. The
 * `@metamask/solana-test-validator-up` package installs the pinned
 * Solana/Agave release and exposes the validator binary spawned here.
 */
import { spawn, type ChildProcess } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { installSolanaTestValidator } from '@metamask/solana-test-validator-up';
import {
  assertValidPort,
  getAvailablePorts,
  isTcpPortAvailable,
  isTcpPortRangeAvailable,
} from '../ports';

export const SOLANA_LOCAL_NODE_HOST = '127.0.0.1';
export const SOLANA_LOCAL_NODE_RPC_PORT = 8899;
export const SOLANA_LOCAL_NODE_URL = `http://${SOLANA_LOCAL_NODE_HOST}:${SOLANA_LOCAL_NODE_RPC_PORT}`;

export type SolanaLocalNodeOptions = {
  faucetPort?: number;
  initialBalances?: Record<string, number>;
  rpcPort?: number;
};

type SolanaRpcResponse<Result> = {
  error?: {
    code: number;
    message: string;
  };
  result?: Result;
};

const PROCESS_OUTPUT_LIMIT = 8_000;

/**
 * Without an explicit `--dynamic-port-range`, `solana-test-validator` assigns
 * its gossip/TVU/TPU ports from 8000 upwards. Gossip binds TCP
 * `127.0.0.1:8000`, which shadows the E2E mock proxy listening on the
 * wildcard address of the same port and silently breaks all browser traffic.
 * A dedicated range keeps the validator away from the harness ports
 * (8000 proxy, 8080+ dapps, 8088-8090 WebSocket mocks, 8545 anvil).
 */
const DYNAMIC_PORT_RANGE_SIZE = 32;
const DYNAMIC_PORT_RANGE_MIN_START = 10_000;
const DYNAMIC_PORT_RANGE_MAX_START = 60_000;
const DYNAMIC_PORT_RANGE_ATTEMPTS = 20;

export class SolanaNode {
  #ledgerDirectory: string | undefined;

  #nodeProcess: ChildProcess | undefined;

  #nodeProcessExitError: Error | undefined;

  #rpcPort = SOLANA_LOCAL_NODE_RPC_PORT;

  #stderr = '';

  get baseUrl(): string {
    return `http://${SOLANA_LOCAL_NODE_HOST}:${this.#rpcPort}`;
  }

  async start(options: SolanaLocalNodeOptions = {}): Promise<void> {
    try {
      await this.#startNativeValidator(options);
      await this.waitForReady(90_000);

      for (const [address, lamports] of Object.entries(
        options.initialBalances ?? {},
      )) {
        if (lamports > 0) {
          await this.fundAccount(address, lamports);
        }
      }
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async fundAccount(address: string, lamports: number): Promise<void> {
    await this.requestRpc<string>('requestAirdrop', [address, lamports]);
    await this.waitForBalance(address, lamports);
  }

  async quit(): Promise<void> {
    const nodeProcess = this.#nodeProcess;
    const ledgerDirectory = this.#ledgerDirectory;
    this.#ledgerDirectory = undefined;
    this.#nodeProcess = undefined;

    if (nodeProcess) {
      await stopProcess(nodeProcess);
    }

    if (ledgerDirectory) {
      await rm(ledgerDirectory, { force: true, recursive: true });
    }
  }

  async requestRpc<Result>(
    method: string,
    params: unknown[] = [],
  ): Promise<Result> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '1337',
        jsonrpc: '2.0',
        method,
        params,
      }),
    });
    const body = (await response.json()) as SolanaRpcResponse<Result>;

    if (!response.ok || body.error) {
      throw new Error(
        `Solana RPC ${method} failed: ${JSON.stringify(body.error ?? body)}`,
      );
    }

    return body.result as Result;
  }

  async waitForBalance(
    address: string,
    minimumLamports: number,
    timeoutMs = 30_000,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const balance = await this.requestRpc<{ value: number }>('getBalance', [
        address,
      ]);
      if (balance.value >= minimumLamports) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(
      `Solana account ${address} was not funded within ${timeoutMs}ms`,
    );
  }

  async waitForReady(timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      this.#throwIfNodeExited();
      try {
        const health = await this.requestRpc<string>('getHealth');
        if (health === 'ok') {
          return;
        }
      } catch {
        // Validator is still starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    throw new Error(
      `Solana test validator did not become ready within ${timeoutMs}ms`,
    );
  }

  async #startNativeValidator(options: SolanaLocalNodeOptions): Promise<void> {
    const { validatorBinary } = await installSolanaTestValidator({
      cwd: process.cwd(),
    });

    const [rpcPort, faucetPort] = await resolveValidatorPorts(options);
    const dynamicPortRangeStart = await findAvailableDynamicPortRangeStart();
    const ledgerDirectory = await mkdtemp(
      join(tmpdir(), 'solana-test-validator-e2e-'),
    );

    this.#ledgerDirectory = ledgerDirectory;
    this.#nodeProcessExitError = undefined;
    this.#rpcPort = rpcPort;
    this.#stderr = '';

    const nodeProcess = spawn(
      validatorBinary,
      [
        '--ledger',
        ledgerDirectory,
        '--reset',
        '--quiet',
        '--bind-address',
        SOLANA_LOCAL_NODE_HOST,
        '--rpc-port',
        String(rpcPort),
        '--faucet-port',
        String(faucetPort),
        '--gossip-port',
        String(dynamicPortRangeStart),
        '--dynamic-port-range',
        `${dynamicPortRangeStart}-${
          dynamicPortRangeStart + DYNAMIC_PORT_RANGE_SIZE - 1
        }`,
      ],
      {
        cwd: ledgerDirectory,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    this.#nodeProcess = nodeProcess;
    nodeProcess.stderr?.on('data', (chunk: Buffer) => {
      this.#stderr = `${this.#stderr}${chunk.toString()}`.slice(
        -PROCESS_OUTPUT_LIMIT,
      );
    });
    nodeProcess.once('error', (error) => {
      this.#nodeProcessExitError = error;
    });
    nodeProcess.once('exit', (code, signal) => {
      this.#nodeProcessExitError = new Error(
        `solana-test-validator exited with code ${code ?? 'null'} and signal ${
          signal ?? 'null'
        }.${this.#stderr ? `\nstderr:\n${this.#stderr}` : ''}`,
      );
    });
  }

  #throwIfNodeExited(): void {
    if (this.#nodeProcessExitError) {
      throw this.#nodeProcessExitError;
    }
  }
}

/**
 * Resolves the RPC and faucet ports for the validator. Explicitly requested
 * ports are validated and checked for availability; missing ports are
 * allocated dynamically so parallel test runs do not collide on the
 * documented defaults.
 *
 * @param options - Start options possibly carrying explicit ports.
 * @returns A `[rpcPort, faucetPort]` tuple.
 */
async function resolveValidatorPorts(
  options: SolanaLocalNodeOptions,
): Promise<[number, number]> {
  const explicitPorts: number[] = [];

  for (const [label, port] of [
    ['Solana RPC port', options.rpcPort],
    ['Solana faucet port', options.faucetPort],
  ] as const) {
    if (port === undefined) {
      continue;
    }
    assertValidPort(port, label);
    if (explicitPorts.includes(port)) {
      throw new Error(`${label} ${port} is used more than once`);
    }
    if (!(await isTcpPortAvailable(port))) {
      throw new Error(`${label} ${port} is already in use`);
    }
    explicitPorts.push(port);
  }

  const allocatedPorts = await getAvailablePorts(
    (options.rpcPort === undefined ? 1 : 0) +
      (options.faucetPort === undefined ? 1 : 0),
    explicitPorts,
  );

  return [
    options.rpcPort ?? (allocatedPorts.shift() as number),
    options.faucetPort ?? (allocatedPorts.shift() as number),
  ];
}

/**
 * Finds the start of a free contiguous port range for the validator's
 * dynamically assigned ports (gossip/TVU/TPU). Availability is checked over
 * TCP; the validator mostly binds UDP within the range, but gossip also
 * listens on TCP, which is the binding that can clash with the E2E harness.
 *
 * @returns The first port of an available range.
 */
async function findAvailableDynamicPortRangeStart(): Promise<number> {
  for (let attempt = 0; attempt < DYNAMIC_PORT_RANGE_ATTEMPTS; attempt += 1) {
    const startPort =
      DYNAMIC_PORT_RANGE_MIN_START +
      Math.floor(
        Math.random() *
          (DYNAMIC_PORT_RANGE_MAX_START - DYNAMIC_PORT_RANGE_MIN_START),
      );
    if (await isTcpPortRangeAvailable(startPort, DYNAMIC_PORT_RANGE_SIZE)) {
      return startPort;
    }
  }

  throw new Error(
    `Unable to find ${DYNAMIC_PORT_RANGE_SIZE} contiguous available ports for the Solana test validator`,
  );
}

async function stopProcess(childProcess: ChildProcess): Promise<void> {
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return;
  }

  const exitPromise = new Promise<void>((resolvePromise) => {
    childProcess.once('exit', () => resolvePromise());
  });
  killProcessTree(childProcess, 'SIGTERM');

  const exitedAfterTerm = await Promise.race([
    exitPromise,
    new Promise<boolean>((resolvePromise) => {
      setTimeout(() => {
        resolvePromise(false);
      }, 5_000);
    }),
  ]);

  if (exitedAfterTerm !== false) {
    return;
  }

  killProcessTree(childProcess, 'SIGKILL');
  await Promise.race([
    exitPromise,
    new Promise<void>((resolvePromise) => setTimeout(resolvePromise, 1_000)),
  ]);
}

function killProcessTree(
  childProcess: ChildProcess,
  signal: NodeJS.Signals,
): void {
  if (process.platform === 'win32') {
    childProcess.kill(signal);
    return;
  }

  if (childProcess.pid) {
    try {
      process.kill(-childProcess.pid, signal);
    } catch {
      childProcess.kill(signal);
    }
  }
}
