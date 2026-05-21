import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';
import { SpeculosClient, type SpeculosClientOptions } from './client';
import { withRetry } from './resilience';
import {
  SPECULOS_APDU_PORT,
  SPECULOS_API_PORT,
  SPECULOS_COMPOSE_FILE,
  SPECULOS_CONTAINER_NAME,
} from './constants';

const execAsync = promisify(exec);

export type SpeculosTestHelperOptions = {
  composeFile?: string;
  apduPort?: number;
  apiPort?: number;
  clientOptions?: SpeculosClientOptions;
};

export type RetryOptions = {
  maxRetries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
};

export class SpeculosTestHelper {
  private client: SpeculosClient;

  private composeFile: string;

  private apduPort: number;

  private apiPort: number;

  private startedByHelper = false;

  constructor(options: SpeculosTestHelperOptions = {}) {
    this.composeFile = options.composeFile ?? SPECULOS_COMPOSE_FILE;
    this.apduPort = options.apduPort ?? SPECULOS_APDU_PORT;
    this.apiPort = options.apiPort ?? SPECULOS_API_PORT;
    this.client = new SpeculosClient({
      apduPort: this.apduPort,
      apiPort: this.apiPort,
      ...options.clientOptions,
    });
  }

  async start(): Promise<void> {
    if (process.env.SKIP_SPECULOS_TESTS === 'true') {
      console.log('[Speculos] Skipping - SKIP_SPECULOS_TESTS is set');
      return;
    }

    if (process.env.SPECULOS_SKIP_DOCKER_START === 'true') {
      console.log(
        '[Speculos] SPECULOS_SKIP_DOCKER_START set — waiting for existing container',
      );
      await this.ensureReady();
      return;
    }

    console.log('[Speculos] Starting container...');
    this.startedByHelper = true;
    await this.startWithRetry({
      maxRetries: 3,
      backoffMs: 1000,
      maxBackoffMs: 8000,
    });
    await this.ensureReady();
    console.log('[Speculos] Ready');
  }

  async stop(): Promise<void> {
    await this.client.disconnect();

    if (
      !this.startedByHelper ||
      process.env.SPECULOS_SKIP_DOCKER_START === 'true'
    ) {
      console.log('[Speculos] Leaving container running');
      return;
    }

    console.log('[Speculos] Stopping container...');
    await execAsync(`docker-compose -f ${this.composeFile} down`);
    this.startedByHelper = false;
    console.log('[Speculos] Stopped');
  }

  async ensureReady(): Promise<void> {
    await this.waitForReady();
    await this.client.connect();
  }

  private async waitForReady(timeout = 60000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const { stdout } = await execAsync(
          `docker-compose -f ${this.composeFile} ps -q`,
        );

        if (stdout.trim()) {
          const { stdout: health } = await execAsync(
            `docker inspect --format='{{.State.Health.Status}}' ${SPECULOS_CONTAINER_NAME}`,
          ).catch(() => ({ stdout: '' }));

          if (health.trim() === 'healthy') {
            return;
          }
        }
      } catch {
        // Container not ready yet
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error('Speculos failed to start within timeout');
  }

  getClient(): SpeculosClient {
    return this.client;
  }

  async startWithRetry(options?: RetryOptions): Promise<void> {
    const maxRetries = options?.maxRetries ?? 3;

    await withRetry(async () => this.attemptStart(), {
      maxRetries,
      onRetry: (err, attempt) => {
        console.warn(
          `[SpeculosTestHelper] Start retry ${attempt} due to: ${err?.message ?? err}`,
        );
      },
    }).catch((err) => {
      if (process.env.SPECULOS_FAIL_FAST === 'true') {
        throw err;
      }
      console.warn(
        '[SpeculosTestHelper] Failed to start Speculos, proceeding with skips if possible',
      );
    });
  }

  private async attemptStart(): Promise<void> {
    for (const port of [this.apduPort, this.apiPort]) {
      const inUse = await this.isPortInUse(port);
      if (inUse) {
        const running = await this.isContainerRunning();
        if (!running) {
          throw new Error(
            `Port ${port} is in use but ${SPECULOS_CONTAINER_NAME} is not running`,
          );
        }
      }
    }

    try {
      await execAsync(`docker-compose -f ${this.composeFile} up -d`);
    } catch (e: unknown) {
      const error = e as { message?: string; stderr?: string };
      const msg = (error?.message ?? '') + (error?.stderr ?? '');
      if (msg.includes('already exists')) {
        console.warn(
          '[SpeculosTestHelper] Container already exists, continuing',
        );
        return;
      }
      throw e;
    }
  }

  private async isContainerRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker inspect --format='{{.State.Running}}' ${SPECULOS_CONTAINER_NAME}`,
      );
      return stdout.trim() === 'true';
    } catch {
      return false;
    }
  }

  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const sock = new net.Socket();
      const onDone = () => {
        sock.destroy();
      };
      sock.setTimeout(1000);
      sock.once('timeout', () => {
        onDone();
        resolve(false);
      });
      sock.once('error', () => {
        onDone();
        resolve(false);
      });
      sock.once('connect', () => {
        onDone();
        resolve(true);
      });
      sock.connect({ host: '127.0.0.1', port } as net.SocketConnectOpts);
    });
  }
}
