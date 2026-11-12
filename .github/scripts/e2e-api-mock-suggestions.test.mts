import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPlan } from './e2e-api-mock-suggestions.mts';

jest.setTimeout(20000);

/**
 * Build a real `git diff -U0` and rewrite its path to fixture.json.
 *
 * @param before - Head file contents.
 * @param after - Drifted file contents.
 * @returns The diff and the original text.
 */
function gitDiff(before: string, after: string): [string, string] {
  const root = mkdtempSync(join(tmpdir(), 'mock-suggest-'));
  const git = (args: string[]) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(result.stderr);
    }
  };
  git(['init', '-q']);
  git(['config', 'user.email', 't@t']);
  git(['config', 'user.name', 't']);
  writeFileSync(join(root, 'f.txt'), before);
  git(['add', 'f.txt']);
  git(['commit', '-q', '-m', 'init']);
  writeFileSync(join(root, 'f.txt'), after);
  const diff = spawnSync('git', ['diff', '-U0'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (diff.status !== 0) {
    throw new Error(diff.stderr);
  }
  return [
    diff.stdout
      .replaceAll('a/f.txt', 'a/fixture.json')
      .replaceAll('b/f.txt', 'b/fixture.json'),
    before,
  ];
}

const whole = '@@ -0,0 +1,3 @@\n+a\n+b\n+c\n';
const files = [{ filename: 'fixture.json', patch: whole }];

describe('buildPlan', () => {
  it('suggests a one-line replacement without a start line', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'a\nB\nc\n');
    const plan = buildPlan(
      diff,
      files,
      { 'fixture.json': before },
      '- **id**: added x',
    );
    expect(plan.mode).toBe('suggestions');
    expect(plan.comments[0].line).toBe(2);
    expect(plan.comments[0]).not.toHaveProperty('start_line');
    expect(plan.comments[0].body).toBe('```suggestion\nB\n```');
    expect(plan.body).toContain('<!-- e2e-api-mock-sync-review -->');
    expect(plan.body).toContain(plan.hash);
    expect(plan.body).toContain('- **id**: added x');
  });

  it('anchors an insertion on the preceding line', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'a\nX\nb\nc\n');
    const plan = buildPlan(diff, files, { 'fixture.json': before }, 'report');
    expect(plan.mode).toBe('suggestions');
    expect(plan.comments[0].body).toBe('```suggestion\na\nX\n```');
    expect(plan.comments[0].line).toBe(1);
  });

  it('anchors an insertion at the start of the file on line 1', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'Z\na\nb\nc\n');
    const plan = buildPlan(diff, files, { 'fixture.json': before }, 'report');
    expect(plan.comments[0].body).toBe('```suggestion\nZ\na\n```');
  });

  it('suggests a deletion as an empty suggestion', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'a\nc\n');
    const plan = buildPlan(diff, files, { 'fixture.json': before }, 'report');
    expect(plan.comments[0].body).toBe('```suggestion\n```');
    expect(plan.comments[0].line).toBe(2);
  });

  it('merges nearby hunks that share one pull request hunk', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'A\nb\nC\n');
    const plan = buildPlan(diff, files, { 'fixture.json': before }, 'report');
    expect(plan.comments).toHaveLength(1);
    expect(plan.comments[0].start_line).toBe(1);
    expect(plan.comments[0].line).toBe(3);
    expect(plan.comments[0].body).toBe('```suggestion\nA\nb\nC\n```');
  });

  it('falls back when the line is outside the pull request diff', () => {
    const narrow = [
      { filename: 'fixture.json', patch: '@@ -2 +2 @@\n-b\n+b\n' },
    ];
    const [diff, before] = gitDiff('a\nb\nc\n', 'A\nb\nc\n');
    const plan = buildPlan(diff, narrow, { 'fixture.json': before }, 'report');
    expect(plan.mode).toBe('fallback');
    expect(plan.reason).toContain('not in this pull request diff');
    expect(plan.comments).toStrictEqual([]);
  });

  it('falls back when the file is not in the pull request', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'a\nB\nc\n');
    const plan = buildPlan(diff, [], { 'fixture.json': before }, 'report');
    expect(plan.mode).toBe('fallback');
    expect(plan.reason).toContain('not in this pull request diff');
  });

  it('falls back when GitHub omitted the patch', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'a\nB\nc\n');
    const plan = buildPlan(
      diff,
      [{ filename: 'fixture.json', patch: null }],
      { 'fixture.json': before },
      'report',
    );
    expect(plan.mode).toBe('fallback');
    expect(plan.reason).toContain('too large to comment');
  });

  it('falls back when the drift needs more than 30 suggestions', () => {
    const sourceLines = Array.from({ length: 199 }, (_, index) =>
      String(index + 1),
    );
    const original = `${sourceLines.join('\n')}\n`;
    const changedLines = [...sourceLines];
    for (let index = 0; index < 31 * 5; index += 5) {
      changedLines[index] = `${changedLines[index]}x`;
    }
    const wide = `@@ -0,0 +1,199 @@\n${sourceLines.map((line) => `+${line}`).join('\n')}\n`;
    const [diff, before] = gitDiff(original, `${changedLines.join('\n')}\n`);
    const plan = buildPlan(
      diff,
      [{ filename: 'fixture.json', patch: wide }],
      { 'fixture.json': before },
      'report',
    );
    expect(plan.mode).toBe('fallback');
    expect(plan.reason).toContain('too many');
  });

  it('keeps the same hash for the same drift', () => {
    const [diff, before] = gitDiff('a\nb\nc\n', 'a\nB\nc\n');
    const first = buildPlan(diff, files, { 'fixture.json': before }, 'report');
    const second = buildPlan(diff, files, { 'fixture.json': before }, 'report');
    expect(first.hash).toBe(second.hash);
    expect(first.hash).not.toBe('');
  });
});
