import { execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import type {
  BuildCapability,
  BuildOptions,
  BuildResult,
} from '@metamask/client-mcp-core';

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

      const buildCommand = options?.buildType
        ? `yarn ${options.buildType}`
        : this.command;

      execSync(buildCommand, {
        cwd: process.cwd(),
        stdio: 'inherit',
        timeout: this.timeout,
      });

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
}
