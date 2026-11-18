import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const kind = process.argv[2];
const {
  WORKFLOW_SCRIPT: script,
  WORKFLOW_ARGS_JSON: argsJson = '[]',
  WORKFLOW_BUNDLE_ANALYZER: bundleAnalyzer,
  WORKFLOW_E2E_DEBUG: e2eDebug,
} = process.env;

if (kind !== 'build' && kind !== 'test') {
  throw new Error('Expected a build or test script');
}

const { scripts } = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>;
};
const allowedName =
  kind === 'build'
    ? script === 'build' || script?.startsWith('build:')
    : script?.startsWith('test:e2e:') ||
      script === 'test:api-specs' ||
      script === 'test:api-specs-multichain';

if (!script || !allowedName || !Object.hasOwn(scripts, script)) {
  throw new Error(`Expected a supported ${kind} script from package.json`);
}

const args: unknown = JSON.parse(argsJson);
if (
  !Array.isArray(args) ||
  !args.every((arg: unknown): arg is string => typeof arg === 'string') ||
  args.some((arg) => arg.includes('\0'))
) {
  throw new Error(
    'WORKFLOW_ARGS_JSON must be a JSON array of strings without NUL bytes',
  );
}

if (kind === 'build' && bundleAnalyzer === 'true') {
  args.push('--bundleAnalyzer');
}

if (kind === 'test') {
  args.push('--retries', '1');
  if (e2eDebug === 'true') {
    process.env.E2E_DEBUG = 'true';
  }
}

const { error, status, signal } = spawnSync('yarn', ['run', script, ...args], {
  shell: false,
  stdio: 'inherit',
});
if (error) {
  throw error;
}
if (signal) {
  console.error(`Yarn terminated with signal ${signal}`);
}
process.exitCode = status ?? 1;
