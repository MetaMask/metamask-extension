import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { findProjectRoot, webpackFile } from './build-paths.ts';

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
      assert.equal(
        findProjectRoot(join(root, entry), temporaryDirectory()),
        root,
      );
    });
  }

  it('uses the working directory when the entry point is outside the checkout', () => {
    const root = temporaryDirectory();
    writeFileSync(join(root, 'builds.yml'), '');
    writeFileSync(join(root, 'package.json'), '{}');
    assert.equal(
      findProjectRoot(join(temporaryDirectory(), 'runner.js'), root),
      root,
    );
  });

  it('fails when neither location belongs to a checkout', () => {
    assert.throws(
      () =>
        findProjectRoot(
          join(temporaryDirectory(), 'runner.js'),
          temporaryDirectory(),
        ),
      /Could not find/u,
    );
  });

  it('resolves native source files without compilation', () => {
    assert.equal(
      webpackFile('launch'),
      join(findProjectRoot(), 'development/webpack/launch.ts'),
    );
    assert.equal(existsSync(webpackFile('launch')), true);
  });
});
