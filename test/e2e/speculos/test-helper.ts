import { exec } from 'child_process';
import { promisify } from 'util';
import { SpeculosClient } from './client';

const execAsync = promisify(exec);

export class SpeculosTestHelper {
  private client: SpeculosClient;
  private composeFile: string;

  constructor() {
    this.client = new SpeculosClient();
    this.composeFile = 'test/e2e/speculos/docker-compose.yml';
  }

  async start(): Promise<void> {
    console.log('[Speculos] Starting container...');
    await execAsync(`docker-compose -f ${this.composeFile} up -d`);

    // Wait for healthcheck
    await this.waitForReady();

    // Connect client
    await this.client.connect();

    console.log('[Speculos] Ready');
  }

  async stop(): Promise<void> {
    console.log('[Speculos] Stopping container...');
    await execAsync(`docker-compose -f ${this.composeFile} down`);
    await this.client.disconnect();
    console.log('[Speculos] Stopped');
  }

  private async waitForReady(timeout = 60000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const { stdout } = await execAsync(
          `docker-compose -f ${this.composeFile} ps -q`,
        );

        if (stdout.trim()) {
          // Container is running, check health
          const { stdout: health } = await execAsync(
            `docker inspect --format='{{.State.Health.Status}}' metamask-speculos`,
          ).catch(() => ({ stdout: '' }));

          if (health.trim() === 'healthy') {
            return;
          }
        }
      } catch (e) {
        // Container not ready yet
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error('Speculos failed to start within timeout');
  }

  getClient(): SpeculosClient {
    return this.client;
  }
}
