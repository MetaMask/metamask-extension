import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';
import { join } from 'path';
import { SpeculosClient, type SpeculosClientOptions } from './client';
import { withRetry } from './resilience';
import {
  SPECULOS_APDU_PORT,
  SPECULOS_API_PORT,
 getDeviceModel, ensureDeviceEnv } from './constants';
import {
  createSpeculosProcess,
  type SpeculosProcess,
} from './process';

const execAsync = promisify(exec);

const SPECULOS_COMPOSE_FILE = 'test/e2e/speculos/docker-compose.yml';
const SPECULOS_CONTAINER_NAME = 'metamask-speculos';

export type SpeculosTestHelperOptions = {
  apduPort?: number;
  apiPort?: number;
  clientOptions?: SpeculosClientOptions;
};

export type RetryOptions = {
  maxRetries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
};

function isLinux(): boolean {
  return process.platform === 'linux';
}

export class SpeculosTestHelper {
  private client: SpeculosClient;

  private apduPort: number;

  private apiPort: number;

  private startedByHelper = false;

  private server: SpeculosProcess | undefined;

  constructor(options: SpeculosTestHelperOptions = {}) {
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

    if (isLinux()) {
      await this.startNative();
    } else {
      await this.startDocker();
    }

    await this.client.connect();
    console.log('[Speculos] Ready');
  }

  async stop(): Promise<void> {
    await this.client.disconnect();

    if (!this.startedByHelper) {
      return;
    }

    if (this.server) {
      console.log('[Speculos] Stopping native process...');
      await this.server.stop();
      this.server = undefined;
    } else {
      console.log('[Speculos] Stopping container...');
      await execAsync(`docker-compose -f ${SPECULOS_COMPOSE_FILE} down`).catch(
        () => undefined,
      );
    }

    this.startedByHelper = false;
    console.log('[Speculos] Stopped');
  }

  getClient(): SpeculosClient {
    return this.client;
  }

  private async startNative(): Promise<void> {
    console.log('[Speculos] Starting native process (Linux)...');
    this.startedByHelper = true;
    await this.startWithRetry({ maxRetries: 3, backoffMs: 1000, maxBackoffMs: 8000 });
  }

  private async startDocker(): Promise<void> {
    if (process.env.SPECULOS_SKIP_DOCKER_START === 'true') {
      console.log('[Speculos] SPECULOS_SKIP_DOCKER_START set — waiting for existing container');
      await this.waitForDockerHealthy();
      return;
    }

    console.log('[Speculos] Starting container (non-Linux)...');
    this.startedByHelper = true;
    await this.startWithRetry({ maxRetries: 3, backoffMs: 1000, maxBackoffMs: 8000 });
  }

  async startWithRetry(options?: RetryOptions): Promise<void> {
    const maxRetries = options?.maxRetries ?? 3;

    await withRetry(
      async () => (isLinux() ? this.attemptNativeStart() : this.attemptDockerStart()),
      {
        maxRetries,
        onRetry: (err, attempt) => {
          console.warn(
            `[SpeculosTestHelper] Start retry ${attempt} due to: ${err?.message ?? err}`,
          );
        },
      },
    ).catch((err) => {
      if (process.env.SPECULOS_FAIL_FAST === 'true') {
        throw err;
      }
      console.warn(
        '[SpeculosTestHelper] Failed to start Speculos, proceeding with skips if possible',
      );
    });
  }

  private async attemptNativeStart(): Promise<void> {
    ensureDeviceEnv();
    const model = getDeviceModel();

    const appPath = join(
      process.cwd(),
      'test',
      'e2e',
      'speculos',
      'apps',
      model.elfFile,
    );

    this.server = createSpeculosProcess({
      app: appPath,
      model: model.speculosModel,
      seed:
        'urban secret spare tunnel rubber rally ladder spatial feature elite success',
      apduPort: this.apduPort,
      apiPort: this.apiPort,
      display: 'headless',
      startTimeout: 60_000,
    });

    await this.server.start();
  }

  private async attemptDockerStart(): Promise<void> {
    const model = getDeviceModel();
    process.env.SPECULOS_ELF_FILENAME = model.elfFile;
    process.env.SPECULOS_DEVICE = model.id;

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
      await execAsync(`docker-compose -f ${SPECULOS_COMPOSE_FILE} up -d`);
      await this.waitForDockerHealthy();
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

  private async waitForDockerHealthy(timeout = 60000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const { stdout } = await execAsync(
          `docker-compose -f ${SPECULOS_COMPOSE_FILE} ps -q`,
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
        // not ready
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error('Speculos container failed to become healthy within timeout');
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
