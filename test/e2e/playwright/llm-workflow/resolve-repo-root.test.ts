import { readFileSync } from 'fs';
import path from 'path';
import { resolveRepoRoot } from './resolve-repo-root';

function readPackageName(dir: string): string {
  const raw = readFileSync(path.join(dir, 'package.json'), 'utf-8');
  return JSON.parse(raw).name as string;
}

describe('resolveRepoRoot', () => {
  it('returns the repository root containing the metamask-crx package.json', () => {
    const root = resolveRepoRoot();

    expect(path.isAbsolute(root)).toBe(true);
    expect(readPackageName(root)).toBe('metamask-crx');
  });

  it('resolves correctly from a deeply nested directory', () => {
    const deepDir = path.join(__dirname, 'capabilities');
    const root = resolveRepoRoot(deepDir);

    expect(readPackageName(root)).toBe('metamask-crx');
  });

  it('resolves correctly when started from the repo root itself', () => {
    const expectedRoot = resolveRepoRoot();
    expect(resolveRepoRoot(expectedRoot)).toBe(expectedRoot);
  });

  it('throws when started from the filesystem root', () => {
    expect(() => resolveRepoRoot('/')).toThrow(
      'Could not locate repository root',
    );
  });
});
