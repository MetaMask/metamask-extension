import * as path from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import type {
  BuildInput,
  BuildResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';

export async function handleBuild(
  input: BuildInput,
  _options?: HandlerOptions,
): Promise<McpResponse<BuildResult>> {
  const startTime = Date.now();
  const buildType = input.buildType ?? 'build:test';
  const extensionPath = path.join(process.cwd(), 'dist', 'chrome');

  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!existsSync(nodeModulesPath)) {
      return createErrorResponse(
        ErrorCodes.MM_DEPENDENCIES_MISSING,
        'Dependencies not installed. Run: yarn install',
        { nodeModulesPath },
        undefined,
        startTime,
      );
    }

    const manifestPath = path.join(extensionPath, 'manifest.json');
    const needsBuild = input.force || !existsSync(manifestPath);

    if (needsBuild) {
      console.log(`Running: yarn ${buildType}`);
      execSync(`yarn ${buildType}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 600000,
      });
    }

    return createSuccessResponse<BuildResult>(
      {
        buildType: 'build:test',
        extensionPathResolved: extensionPath,
      },
      undefined,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_BUILD_FAILED,
      `Build failed: ${message}`,
      { buildType },
      undefined,
      startTime,
    );
  }
}
