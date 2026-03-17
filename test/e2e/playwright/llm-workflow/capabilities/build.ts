import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import type {
  BuildCapability,
  BuildOptions,
  BuildResult,
} from '@metamask/client-mcp-core';

/**
 * Allowlist of valid build types that can be passed to `yarn`.
 * This prevents shell injection when constructing the build command.
 */
const ALLOWED_BUILD_TYPES: ReadonlySet<string> = new Set([
  'build:test',
  'build:test:flask',
  'build:test:mv2',
  'build:test:mmi',
]);

export type MetaMaskBuildCapabilityOptions = {
  command?: string;
  outputPath?: string;
  timeout?: number;
};

export class MetaMaskBuildCapability implements BuildCapability {
  private readonly command: string;

  private readonly outputPath: string;

  private readonly timeout: number;

  constructor(options: MetaMaskBuildCapabilityOptions = {}) {
    this.command = options.command ?? 'yarn build:test';
    this.outputPath = options.outputPath ?? 'dist/chrome';
    this.timeout = options.timeout ?? 600000;
  }

  async build(options?: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now();

    try {
      const alreadyBuilt = await this.isBuilt();

      if (!options?.force && alreadyBuilt) {
        return {
          success: true,
          extensionPath: this.getExtensionPath(),
          durationMs: Date.now() - startTime,
        };
      }

      const buildArgs = this.resolveBuildArgs(options?.buildType);
      await this.runBuildCommand(buildArgs);

      return {
        success: true,
        extensionPath: this.getExtensionPath(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        extensionPath: this.getExtensionPath(),
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getExtensionPath(): string {
    return path.join(process.cwd(), this.outputPath);
  }

  async isBuilt(): Promise<boolean> {
    const manifestPath = path.join(this.getExtensionPath(), 'manifest.json');
    return existsSync(manifestPath);
  }

  private resolveBuildArgs(buildType?: string): string[] {
    if (buildType) {
      if (!ALLOWED_BUILD_TYPES.has(buildType)) {
        throw new Error(
          `Invalid buildType: "${buildType}". ` +
            `Allowed values: ${[...ALLOWED_BUILD_TYPES].join(', ')}`,
        );
      }
      return [buildType];
    }

    const parts = this.command.split(/\s+/u);
    const commandParts = parts[0] === 'yarn' ? parts.slice(1) : parts;

    for (const part of commandParts) {
      if (!ALLOWED_BUILD_TYPES.has(part)) {
        throw new Error(
          `Invalid build command part: "${part}" in "${this.command}". ` +
            `Allowed values: ${[...ALLOWED_BUILD_TYPES].join(', ')}`,
        );
      }
    }

    return commandParts;
  }

  private async runBuildCommand(buildArgs: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('yarn', buildArgs, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      // Forward child stdout/stderr to process.stderr to avoid
      // corrupting the MCP stdio protocol on process.stdout.
      child.stdout?.on('data', (data: Buffer) => {
        process.stderr.write(data);
      });
      child.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(data);
      });

      let settled = false;
      let timeoutId: NodeJS.Timeout | undefined;
      let forceKillTimer: NodeJS.Timeout | undefined;

      const settle = (callback: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (forceKillTimer) {
          clearTimeout(forceKillTimer);
        }
        callback();
      };

      if (this.timeout > 0) {
        timeoutId = setTimeout(() => {
          const timeoutError = new Error(
            `Build command timed out after ${this.timeout}ms: yarn ${buildArgs.join(' ')}`,
          );

          child.kill('SIGTERM');

          forceKillTimer = this.scheduleForceKill(child);

          settle(() => reject(timeoutError));
        }, this.timeout);
      }

      child.on('error', (error) => {
        settle(() => reject(error));
      });

      child.on('exit', (code, signal) => {
        if (code === 0) {
          settle(resolve);
          return;
        }

        const signalSuffix = signal ? ` (signal: ${signal})` : '';
        settle(() =>
          reject(
            new Error(
              `Build process exited with code ${code ?? 'unknown'}${signalSuffix}`,
            ),
          ),
        );
      });
    });
  }

  private scheduleForceKill(child: ChildProcess): NodeJS.Timeout {
    const timer = setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, 5000);

    timer.unref?.();
    return timer;
  }
}
