import { execFileSync } from 'child_process';

export const SOLANA_LOCAL_NODE_HOST = '127.0.0.1';
export const SOLANA_LOCAL_NODE_RPC_PORT = 8899;
export const SOLANA_LOCAL_NODE_URL = `http://${SOLANA_LOCAL_NODE_HOST}:${SOLANA_LOCAL_NODE_RPC_PORT}`;

export type SolanaLocalNodeOptions = {
  dockerImage?: string;
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

const DEFAULT_FAUCET_PORT = 9900;
const DEFAULT_DOCKER_IMAGE = 'solanalabs/solana:stable';
const DOCKER_CONTAINER_NAME = 'solana-test-validator-e2e';
const DOCKER_FAUCET_PORT = 9900;
const DOCKER_LEDGER_PATH = '/tmp/solana-test-validator-e2e';
const DOCKER_RPC_PORT = 8899;

export class SolanaNode {
  #dockerImage = DEFAULT_DOCKER_IMAGE;

  #rpcPort = SOLANA_LOCAL_NODE_RPC_PORT;

  get baseUrl(): string {
    return `http://${SOLANA_LOCAL_NODE_HOST}:${this.#rpcPort}`;
  }

  async start(options: SolanaLocalNodeOptions = {}): Promise<void> {
    this.#dockerImage = options.dockerImage ?? DEFAULT_DOCKER_IMAGE;
    this.#rpcPort = options.rpcPort ?? SOLANA_LOCAL_NODE_RPC_PORT;

    this.#startDockerValidator(options);

    await this.waitForReady(90_000);

    for (const [address, lamports] of Object.entries(
      options.initialBalances ?? {},
    )) {
      if (lamports > 0) {
        await this.fundAccount(address, lamports);
      }
    }
  }

  async fundAccount(address: string, lamports: number): Promise<void> {
    await this.requestRpc<string>('requestAirdrop', [address, lamports]);
    await this.waitForBalance(address, lamports);
  }

  async quit(): Promise<void> {
    this.#removeDockerContainer();
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

  #startDockerValidator(options: SolanaLocalNodeOptions = {}): void {
    const faucetPort = options.faucetPort ?? DEFAULT_FAUCET_PORT;
    this.#removeDockerContainer();

    try {
      const versionOutput = execFileSync(
        'docker',
        [
          'run',
          '--rm',
          '--entrypoint',
          'solana-test-validator',
          this.#dockerImage,
          '--version',
        ],
        { encoding: 'utf-8' },
      );
      console.log(`Docker Solana test validator version: ${versionOutput}`);

      execFileSync(
        'docker',
        [
          'run',
          '-d',
          '--rm',
          '--name',
          DOCKER_CONTAINER_NAME,
          '-p',
          `${this.#rpcPort}:${DOCKER_RPC_PORT}`,
          '-p',
          `${faucetPort}:${DOCKER_FAUCET_PORT}`,
          this.#dockerImage,
          'solana-test-validator',
          '--ledger',
          DOCKER_LEDGER_PATH,
          '--reset',
          '--quiet',
          '--bind-address',
          '0.0.0.0',
          '--rpc-port',
          String(DOCKER_RPC_PORT),
          '--faucet-port',
          String(DOCKER_FAUCET_PORT),
        ],
        { stdio: 'pipe' },
      );
    } catch (error) {
      console.error('Failed to start solana-test-validator in Docker:', error);
      throw new Error(
        'solana-test-validator is not available on the host and Docker could not start the Solana validator container.',
      );
    }
  }

  #removeDockerContainer(): void {
    try {
      execFileSync('docker', ['rm', '-f', DOCKER_CONTAINER_NAME], {
        stdio: 'pipe',
      });
    } catch {
      // Container did not exist.
    }
  }
}
