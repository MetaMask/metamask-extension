/**
 * @jest-environment node
 */

/* eslint-disable import-x/no-nodejs-modules */
import { spawnSync } from 'child_process';
import {
  appendFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import path from 'path';

type CommandResult = {
  status: number;
  output: string;
};

const checkerSourcePath = path.resolve(
  __dirname,
  '../../.agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts',
);
const tsxLoaderPath = path.resolve(
  __dirname,
  '../../node_modules/tsx/dist/loader.mjs',
);

const tempRepos: string[] = [];

const runCommand = (
  cwd: string,
  cmd: string,
  args: string[],
): CommandResult => {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
  });

  return {
    status: result.status ?? -1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
};

const runGit = (cwd: string, args: string[]) => {
  const result = runCommand(cwd, 'git', args);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed:\n${result.output}`);
  }
};

const runChecker = (cwd: string, args: string[]): CommandResult =>
  runCommand(cwd, process.execPath, [
    '--import',
    tsxLoaderPath,
    checkerSourcePath,
    ...args,
  ]);

const createRepo = (): string => {
  const repo = mkdtempSync(path.join(tmpdir(), 'ab-checker-test-'));
  tempRepos.push(repo);

  runGit(repo, ['init']);
  runGit(repo, ['config', 'user.name', 'AB Checker Test']);
  runGit(repo, ['config', 'user.email', 'ab-checker-test@example.com']);
  runGit(repo, ['config', 'commit.gpgsign', 'false']);

  mkdirSync(path.join(repo, 'app'), { recursive: true });
  writeFileSync(path.join(repo, 'app/sample.ts'), 'export const sample = 1;\n');

  runGit(repo, ['add', 'app/sample.ts']);
  runGit(repo, ['commit', '-m', 'init']);

  return repo;
};

afterAll(() => {
  for (const repo of tempRepos) {
    rmSync(repo, { recursive: true, force: true });
  }
});

describe('check-ab-testing-compliance.ts', () => {
  it('fails with mode conflict', () => {
    const repo = createRepo();
    const result = runChecker(repo, ['--staged', '--files', 'app/sample.ts']);

    expect(result.status).toBe(2);
    expect(result.output).toContain('ERROR: Choose exactly one mode');
  });

  it('returns no-op success on clean tree in staged mode', () => {
    const repo = createRepo();
    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      'no staged files and no working-tree changed files to inspect',
    );
  });

  it('falls back to worktree files in staged mode', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      'export const changed = 2;\n',
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      'falling back to working-tree changed files',
    );
  });

  it('fails when new ab_tests payload is added', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      "const payload = { ab_tests: { example: 'control' } };\n",
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(1);
    expect(result.output).toContain("added 'ab_tests' payload");
  });

  it('fails when literal active_ab_tests object misses key_value_pair', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      "const payload = { active_ab_tests: [{ key: 'swapsSWAPS9999AbtestFoo', value: 'control' }] };\n",
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(1);
    expect(result.output).toContain('malformed literal active_ab_tests object');
  });

  it('fails when inline useABTest variants object has no control', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      "const assignment = useABTest('swapsSWAPS9999AbtestFoo', { treatment: { label: 'x' } });\n",
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'inline useABTest variants object is missing control',
    );
  });

  it('passes for by-reference variants with destructured useABTest result', () => {
    const repo = createRepo();
    writeFileSync(
      path.join(repo, 'app/abTestConfig.ts'),
      [
        "export const FLAG_KEY = 'swapsSWAPS9999AbtestFoo';",
        'export const VARIANTS = {',
        "  control: { label: 'control' },",
        "  treatment: { label: 'treatment' },",
        '};',
        '',
      ].join('\n'),
    );

    writeFileSync(
      path.join(repo, 'app/sample.ts'),
      [
        'const { variantName, isActive } = useABTest(FLAG_KEY, VARIANTS);',
        'const payload = isActive',
        '  ? { active_ab_tests: [createActiveABTestAssignment(FLAG_KEY, variantName)] }',
        '  : {};',
        '',
      ].join('\n'),
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain(
      'inline useABTest variants object is missing control',
    );
  });

  it('passes when helper-only active_ab_tests has sibling metadata key/value fields', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      "const payload = { active_ab_tests: [createActiveABTestAssignment(FLAG_KEY, variantName)], metadata: { key: 'foo', value: 'bar' } };\n",
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain(
      'malformed literal active_ab_tests object',
    );
  });

  it('passes when literal active_ab_tests includes key_value_pair', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      "const payload = { active_ab_tests: [{ key: 'swapsSWAPS9999AbtestFoo', value: 'control', key_value_pair: 'swapsSWAPS9999AbtestFoo=control' }] };\n",
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain(
      'malformed literal active_ab_tests object',
    );
  });

  it('fails when helper-built and malformed literal entries are mixed together', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      [
        'const payload = {',
        '  active_ab_tests: [',
        '    createActiveABTestAssignment(FLAG_KEY, variantName),',
        "    { key: 'swapsSWAPS9999AbtestFoo', value: 'control' },",
        '  ],',
        '};',
        '',
      ].join('\n'),
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(1);
    expect(result.output).toContain('malformed literal active_ab_tests object');
  });

  it('ignores invalid A/B examples in test files', () => {
    const repo = createRepo();
    writeFileSync(
      path.join(repo, 'app/sample.test.ts'),
      [
        "const payload = { ab_tests: { example: 'control' } };",
        "const invalidActive = { active_ab_tests: [{ key: 'swapsSWAPS9999AbtestFoo' }] };",
        "const assignment = useABTest('swapsSWAPS9999AbtestFoo', { treatment: { label: 'x' } });",
        '',
      ].join('\n'),
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain("added 'ab_tests' payload");
    expect(result.output).not.toContain(
      'inline useABTest variants object is missing control',
    );
  });

  it('ignores invalid A/B examples in spec files', () => {
    const repo = createRepo();
    writeFileSync(
      path.join(repo, 'app/sample.spec.ts'),
      [
        "const payload = { ab_tests: { example: 'control' } };",
        "const invalidActive = { active_ab_tests: [{ key: 'swapsSWAPS9999AbtestFoo' }] };",
        "const assignment = useABTest('swapsSWAPS9999AbtestFoo', { treatment: { label: 'x' } });",
        '',
      ].join('\n'),
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain("added 'ab_tests' payload");
    expect(result.output).not.toContain(
      'inline useABTest variants object is missing control',
    );
  });

  it('counts spec files as test updates when risky A/B changes are present', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      "const assignment = useABTest('swapsSWAPS9999AbtestFoo', { control: {}, treatment: {} });\n",
    );
    writeFileSync(
      path.join(repo, 'app/sample.spec.ts'),
      "describe('sample', () => expect(true).toBe(true));\n",
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain(
      'Risky A/B integration changes were detected without any test-file updates',
    );
  });

  it('treats shared enricher changes as risky A/B integration changes', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      'const enriched = enrichWithABTests(payload, flags);\n',
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      'Risky A/B integration changes were detected without any test-file updates',
    );
  });

  it('does not warn on regex source that mentions Abtest', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      `const pattern = /['"][^'"]*Abtest[^'"]*['"]/gu;\n`,
    );

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain("Abtest key ']*Abtest[^'");
  });

  it('still scans staged added lines whose code starts with ++', () => {
    const repo = createRepo();
    appendFileSync(
      path.join(repo, 'app/sample.ts'),
      "++ab_tests: { example: 'control' }\n",
    );
    runGit(repo, ['add', 'app/sample.ts']);

    const result = runChecker(repo, ['--staged']);

    expect(result.status).toBe(1);
    expect(result.output).toContain("added 'ab_tests' payload");
  });
});
