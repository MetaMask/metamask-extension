import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { KNOWLEDGE_DIR } from '../constants';
import type { ScenarioStateMode } from '../scenarios/types';
import { WALLET_PASSWORD } from '../../../e2e/constants';

function mm(args: string[], cwd: string): string {
  return execFileSync(path.join(cwd, 'node_modules', '.bin', 'mm'), args, {
    cwd,
    encoding: 'utf-8',
    timeout: 120_000,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

export function setupTrial(
  cwd: string,
  stateMode: ScenarioStateMode,
  statePreset: string | undefined,
  coldStart: boolean,
): void {
  if (coldStart) {
    const knowledgeDir = path.join(cwd, KNOWLEDGE_DIR);
    if (fs.existsSync(knowledgeDir)) {
      fs.rmSync(knowledgeDir, { recursive: true, force: true });
    }
  }

  const launchArgs = ['launch', '--state', stateMode];
  if (stateMode === 'custom' && statePreset) {
    launchArgs.push('--preset', statePreset);
  }

  mm(launchArgs, cwd);
  waitForReady(cwd);
}

function waitForReady(cwd: string, maxRetries = 10): void {
  let unlockAttempted = false;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const output = mm(['describe-screen'], cwd);
      const parsed = JSON.parse(output);
      const { state: parsedState} = parsed;
      if (parsedState.isLoaded && parsedState.isUnlocked) {
        return;
      }
      if (parsedState.isLoaded && !parsedState.isUnlocked && !unlockAttempted) {
        unlockExtension(cwd);
        unlockAttempted = true;
        continue;
      }
    } catch {
      /* retry */
    }
    sleepSync(2000);
  }
  throw new Error('Extension did not reach ready state after launch');
}

function unlockExtension(cwd: string): void {
  mm(['type', '--testid', 'unlock-password', WALLET_PASSWORD], cwd);
  sleepSync(200);
  mm(['click', '--testid', 'unlock-submit'], cwd);
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function takeScreenshot(
  cwd: string,
  name: string,
  outputDir: string,
): string {
  const output = mm(['screenshot', '--name', name], cwd);
  const parsed = JSON.parse(output);

  const destPath = path.join(outputDir, `${name}.png`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  if (parsed.base64) {
    fs.writeFileSync(destPath, Buffer.from(parsed.base64, 'base64'));
  } else if (parsed.path && fs.existsSync(parsed.path)) {
    fs.copyFileSync(parsed.path, destPath);
  }

  return destPath;
}
