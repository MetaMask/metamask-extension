/** @jest-environment node */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, it } from '@jest/globals';

// The workflows run on Linux. Use an executable fixture to observe the script inputs.
const describeOnUnix = process.platform === 'win32' ? describe.skip : describe;

describeOnUnix('run-workflow-script', () => {
  let fixtureDirectory: string;

  beforeAll(() => {
    fixtureDirectory = mkdtempSync(join(tmpdir(), 'run-workflow-script-'));
    writeFileSync(
      join(fixtureDirectory, 'package.json'),
      JSON.stringify({
        scripts: {
          build: 'fixture-build',
          'build:fixture': 'fixture-build',
          'test:e2e:fixture': 'fixture-test',
          lint: 'fixture-lint',
        },
      }),
    );
    writeFileSync(
      join(fixtureDirectory, 'yarn'),
      `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'run') {
  args.shift();
}
require('node:fs').writeFileSync(process.env.FIXTURE_INVOCATION, JSON.stringify({
  args,
  debug: process.env.E2E_DEBUG,
}));
process.exitCode = Number(process.env.FIXTURE_EXIT_CODE ?? 0);
`,
      { mode: 0o700 },
    );
  });

  afterAll(() => {
    rmSync(fixtureDirectory, { recursive: true });
  });

  /**
   * Run the CLI with a local Yarn executable that only reports its arguments.
   *
   * @param kind - The workflow script category.
   * @param env - The inputs passed by the workflow step.
   * @returns The CLI subprocess result.
   */
  function run(kind: 'build' | 'test', env: NodeJS.ProcessEnv) {
    const invocationPath = join(fixtureDirectory, 'invocation.json');
    rmSync(invocationPath, { force: true });
    const result = spawnSync(
      process.execPath,
      [resolve('.github/scripts/run-workflow-script.mts'), kind],
      {
        cwd: fixtureDirectory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          PATH: `${fixtureDirectory}${delimiter}${process.env.PATH ?? ''}`,
          FIXTURE_INVOCATION: invocationPath,
          ...env,
        },
      },
    );
    const invocation: unknown = existsSync(invocationPath)
      ? JSON.parse(readFileSync(invocationPath, 'utf8'))
      : undefined;
    return { ...result, invocation };
  }

  it('preserves literal build argument boundaries', () => {
    const args = ['two words', '', '*', '$EXAMPLE', 'one;two', 'line\nbreak'];

    const result = run('build', {
      WORKFLOW_SCRIPT: 'build',
      WORKFLOW_ARGS_JSON: JSON.stringify(args),
      WORKFLOW_BUNDLE_ANALYZER: 'false',
    });

    expect(result.status).toBe(0);
    expect(result.invocation).toStrictEqual({
      args: ['build', ...args],
    });
  });

  it('appends the bundle analyzer flag when enabled', () => {
    const result = run('build', {
      WORKFLOW_SCRIPT: 'build:fixture',
      WORKFLOW_ARGS_JSON: '["--zip"]',
      WORKFLOW_BUNDLE_ANALYZER: 'true',
    });

    expect(result.status).toBe(0);
    expect(result.invocation).toStrictEqual({
      args: ['build:fixture', '--zip', '--bundleAnalyzer'],
    });
  });

  it('runs the selected E2E script with debug mode and one retry', () => {
    const result = run('test', {
      WORKFLOW_SCRIPT: 'test:e2e:fixture',
      WORKFLOW_E2E_DEBUG: 'true',
    });

    expect(result.status).toBe(0);
    expect(result.invocation).toStrictEqual({
      args: ['test:e2e:fixture', '--retries', '1'],
      debug: 'true',
    });
  });

  it.each(['build:unknown', 'lint'])(
    'rejects the unsupported build script %s before invoking Yarn',
    (script) => {
      const result = run('build', { WORKFLOW_SCRIPT: script });

      expect(result.status).toBeGreaterThan(0);
      expect(result.invocation).toBeUndefined();
    },
  );

  it('rejects nested build arguments before Yarn can receive coerced strings', () => {
    const result = run('build', {
      WORKFLOW_SCRIPT: 'build',
      WORKFLOW_ARGS_JSON: '[["two words"]]',
    });

    expect(result.status).toBeGreaterThan(0);
    expect(result.invocation).toBeUndefined();
  });

  it('propagates the exit status from Yarn', () => {
    const result = run('build', {
      WORKFLOW_SCRIPT: 'build',
      FIXTURE_EXIT_CODE: '7',
    });

    expect(result.status).toBe(7);
  });
});
