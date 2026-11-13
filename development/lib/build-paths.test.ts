/** @jest-environment node */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findProjectRoot, webpackFile } from './build-paths';

describe('build paths', () => {
  const directories: string[] = [];
  const temporaryDirectory = () => {
    const directory = mkdtempSync(join(tmpdir(), 'webpack-paths-'));
    directories.push(directory);
    return directory;
  };
  afterEach(() =>
    directories
      .splice(0)
      .forEach((directory) =>
        rmSync(directory, { recursive: true, force: true }),
      ),
  );

  for (const entry of [
    'development/webpack/launch.ts',
    'development/.webpack/development/webpack/launch.js',
  ]) {
    it(`finds the checkout from ${entry} when launched elsewhere`, () => {
      const root = temporaryDirectory();
      const compiled = join(root, 'development/.webpack');
      mkdirSync(compiled, { recursive: true });
      writeFileSync(join(root, 'builds.yml'), '');
      writeFileSync(join(root, 'package.json'), '{}');
      // The compiled tree can contain its own copied package.json.
      writeFileSync(join(compiled, 'package.json'), '{}');
      expect(findProjectRoot(join(root, entry), temporaryDirectory())).toBe(
        root,
      );
    });
  }

  it('uses the working directory when the entry point is outside the checkout', () => {
    const root = temporaryDirectory();
    writeFileSync(join(root, 'builds.yml'), '');
    writeFileSync(join(root, 'package.json'), '{}');
    expect(findProjectRoot(join(temporaryDirectory(), 'runner.js'), root)).toBe(
      root,
    );
  });

  it('fails when neither location belongs to a checkout', () => {
    expect(() =>
      findProjectRoot(
        join(temporaryDirectory(), 'runner.js'),
        temporaryDirectory(),
      ),
    ).toThrow('Could not find');
  });

  it('resolves compiled tooling when loaded through CommonJS', () => {
    expect(webpackFile('launch')).toBe(
      join(
        findProjectRoot(),
        'development/.webpack/development/webpack/launch.js',
      ),
    );
  });
});
